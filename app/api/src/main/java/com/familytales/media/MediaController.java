package com.familytales.media;

import com.familytales.family.FamilyEntity;
import com.familytales.family.FamilyRepository;
import com.familytales.story.StoryEntity;
import com.familytales.story.StoryRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/** رفع الصوت المباشر للتخزين عبر رابط موقّع (لا يمر عبر الـAPI). */
@RestController
@RequestMapping("/api/v1")
public class MediaController {

    private final StorageService storage;
    private final MediaAssetRepository assets;
    private final StoryRepository stories;
    private final FamilyRepository families;

    public MediaController(StorageService storage, MediaAssetRepository assets,
                           StoryRepository stories, FamilyRepository families) {
        this.storage = storage;
        this.assets = assets;
        this.stories = stories;
        this.families = families;
    }

    public record AudioUploadRequest(@NotNull String contentType) {}
    public record UploadTicket(String assetId, String key, String uploadUrl, String getUrl) {}

    private UUID familyOf(Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        FamilyEntity f = families.findFirstByOwnerId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "لا توجد عائلة"));
        return f.getId();
    }

    /** ينشئ سجل أصل ويرجع رابط رفع موقّع؛ العميل يرفع الملف مباشرة للتخزين. */
    @PostMapping("/stories/{storyId}/audio")
    public UploadTicket requestAudioUpload(Authentication auth, @PathVariable UUID storyId,
                                           @RequestBody AudioUploadRequest req) {
        UUID familyId = familyOf(auth);
        StoryEntity s = stories.findById(storyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "الحكاية غير موجودة"));
        if (!s.getFamilyId().equals(familyId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ليست ضمن عائلتك");

        String ext = req.contentType().contains("mp4") || req.contentType().contains("mp4a") ? "m4a"
                   : req.contentType().contains("mpeg") ? "mp3" : "webm";
        String key = "families/" + familyId + "/stories/" + storyId + "/audio/" + UUID.randomUUID() + "." + ext;

        MediaAssetEntity a = new MediaAssetEntity();
        a.setFamilyId(familyId);
        a.setStoryId(storyId);
        a.setKind("audio");
        a.setStorageKey(key);
        a.setContentType(req.contentType());
        a = assets.save(a);

        return new UploadTicket(a.getId().toString(), key,
            storage.presignPut(key, req.contentType()), storage.presignGet(key));
    }
}
