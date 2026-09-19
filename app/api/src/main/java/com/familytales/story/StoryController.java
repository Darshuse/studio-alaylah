package com.familytales.story;

import com.familytales.family.FamilyEntity;
import com.familytales.family.FamilyRepository;
import com.familytales.media.MediaAssetRepository;
import com.familytales.media.StorageService;
import com.familytales.render.StorySceneRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/** إنشاء وقراءة الحكايات ضمن عائلة المستخدم المصادَق. */
@RestController
@RequestMapping("/api/v1/stories")
public class StoryController {

    private final StoryRepository stories;
    private final StoryRevisionRepository revisions;
    private final FamilyRepository families;
    private final MediaAssetRepository media;
    private final StorySceneRepository scenes;
    private final StorageService storage;

    public StoryController(StoryRepository stories, StoryRevisionRepository revisions,
                           FamilyRepository families, MediaAssetRepository media,
                           StorySceneRepository scenes, StorageService storage) {
        this.stories = stories;
        this.revisions = revisions;
        this.families = families;
        this.media = media;
        this.scenes = scenes;
        this.storage = storage;
    }

    public record CreateStoryRequest(String title, @NotNull String sourceKind) {}
    public record SaveTextRequest(@NotNull String body) {}
    public record SetTitleRequest(String title) {}
    public record StoryView(String id, String title, String displayTitle, String status, String sourceKind,
                            boolean textApproved, String text, OffsetDateTime createdAt,
                            boolean hasFilm, String coverUrl) {
        static StoryView of(StoryEntity s, String text, boolean hasFilm, String displayTitle, String coverUrl) {
            return new StoryView(s.getId().toString(), s.getTitle(), displayTitle, s.getStatus(),
                s.getSourceKind(), s.isTextApproved(), text, s.getCreatedAt(), hasFilm, coverUrl);
        }
    }

    private boolean hasFilm(UUID storyId) {
        return media.findFirstByStoryIdAndKindOrderByCreatedAtDesc(storyId, "video").isPresent();
    }

    /** رابط صورة أول مشهد (غلاف مصغّر) إن وُجدت. */
    private String coverUrl(UUID storyId) {
        return scenes.findByStoryIdOrderBySceneOrder(storyId).stream().findFirst()
            .map(sc -> sc.getImageKey() != null ? storage.presignGet(sc.getImageKey()) : null)
            .orElse(null);
    }

    /** عنوان للعرض: عنوان القصة إن وُجد، وإلا يُشتقّ من أول النص. */
    private String displayTitle(StoryEntity s) {
        if (s.getTitle() != null && !s.getTitle().isBlank()) return s.getTitle();
        return deriveTitle(latestText(s.getId()));
    }

    /** يشتقّ عنوانًا مختصرًا من أول جملة/كلمات النص. */
    static String deriveTitle(String text) {
        if (text == null || text.isBlank()) return null;
        String first = text.trim().split("(?<=[.!؟\\n])")[0].trim();
        if (first.isEmpty()) first = text.trim();
        String[] words = first.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(6, words.length); i++) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(words[i]);
        }
        String t = sb.toString();
        if (t.length() > 45) t = t.substring(0, 45);
        return t.isBlank() ? null : t;
    }

    private UUID familyOf(Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        FamilyEntity f = families.findFirstByOwnerId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "لا توجد عائلة لهذا المستخدم"));
        return f.getId();
    }

    /** يجلب الحكاية ويتحقق من ملكيتها لعائلة المستخدم. */
    private StoryEntity ownedStory(Authentication auth, UUID id) {
        StoryEntity s = stories.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "الحكاية غير موجودة"));
        if (!s.getFamilyId().equals(familyOf(auth)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ليست ضمن عائلتك");
        return s;
    }

    private String latestText(UUID storyId) {
        return revisions.findFirstByStoryIdOrderByCreatedAtDesc(storyId)
            .map(StoryRevisionEntity::getBody).orElse(null);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StoryView create(Authentication auth, @RequestBody CreateStoryRequest req) {
        StoryEntity s = new StoryEntity();
        s.setFamilyId(familyOf(auth));
        s.setTitle(req.title());
        s.setSourceKind(req.sourceKind() == null ? "voice" : req.sourceKind());
        s = stories.save(s);
        return StoryView.of(s, null, false, displayTitle(s), null);
    }

    @GetMapping
    public List<StoryView> list(Authentication auth) {
        return stories.findByFamilyIdOrderByCreatedAtDesc(familyOf(auth))
            .stream().map(s -> StoryView.of(s, null, hasFilm(s.getId()), displayTitle(s), coverUrl(s.getId()))).toList();
    }

    @GetMapping("/{id}")
    public StoryView get(Authentication auth, @PathVariable UUID id) {
        StoryEntity s = ownedStory(auth, id);
        return StoryView.of(s, latestText(id), hasFilm(id), displayTitle(s), coverUrl(id));
    }

    /** تعيين عنوان الحكاية (يكتبه المستخدم في المراجعة). */
    @PostMapping("/{id}/title")
    public StoryView setTitle(Authentication auth, @PathVariable UUID id, @RequestBody SetTitleRequest req) {
        StoryEntity s = ownedStory(auth, id);
        s.setTitle(req.title() != null && !req.title().isBlank() ? req.title().trim() : null);
        stories.save(s);
        return StoryView.of(s, latestText(id), hasFilm(id), displayTitle(s), coverUrl(id));
    }

    /** حفظ/تحديث مسودة النص (مراجعة جديدة). */
    @PostMapping("/{id}/text")
    public StoryView saveText(Authentication auth, @PathVariable UUID id, @RequestBody SaveTextRequest req) {
        StoryEntity s = ownedStory(auth, id);
        StoryRevisionEntity r = new StoryRevisionEntity();
        r.setStoryId(id);
        r.setBody(req.body());
        revisions.save(r);
        return StoryView.of(s, req.body(), hasFilm(id), displayTitle(s), coverUrl(id));
    }

    /** اعتماد النص — بوابة قبل توليد المشاهد. */
    @PostMapping("/{id}/approve-text")
    public StoryView approveText(Authentication auth, @PathVariable UUID id) {
        StoryEntity s = ownedStory(auth, id);
        StoryRevisionEntity r = revisions.findFirstByStoryIdOrderByCreatedAtDesc(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "لا يوجد نص لاعتماده"));
        r.setApproved(true);
        revisions.save(r);
        s.setTextApproved(true);
        s.setStatus("text_approved");
        // اشتقاق عنوان تلقائي من النص إن لم يكن للحكاية عنوان
        if (s.getTitle() == null || s.getTitle().isBlank()) {
            String derived = deriveTitle(r.getBody());
            if (derived != null) s.setTitle(derived);
        }
        stories.save(s);
        return StoryView.of(s, r.getBody(), hasFilm(id), displayTitle(s), coverUrl(id));
    }
}
