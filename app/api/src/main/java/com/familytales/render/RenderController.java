package com.familytales.render;

import com.familytales.family.FamilyEntity;
import com.familytales.family.FamilyRepository;
import com.familytales.media.MediaAssetRepository;
import com.familytales.media.StorageService;
import com.familytales.story.StoryEntity;
import com.familytales.story.StoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/** بدء توليد المشاهد، استطلاع حالة المهمة، وقراءة المشاهد بروابط صور موقّعة. */
@RestController
@RequestMapping("/api/v1")
public class RenderController {

    private final SceneGenerationService generation;
    private final GenerationJobRepository jobs;
    private final StorySceneRepository scenes;
    private final StoryRepository stories;
    private final FamilyRepository families;
    private final StorageService storage;
    private final MediaAssetRepository media;

    public RenderController(SceneGenerationService generation, GenerationJobRepository jobs,
                            StorySceneRepository scenes, StoryRepository stories,
                            FamilyRepository families, StorageService storage, MediaAssetRepository media) {
        this.generation = generation;
        this.jobs = jobs;
        this.scenes = scenes;
        this.stories = stories;
        this.families = families;
        this.storage = storage;
        this.media = media;
    }

    public record GenerateRequest(Integer sceneCount) {}
    public record JobView(String id, String kind, String status, int progress, String error) {
        static JobView of(GenerationJobEntity j) {
            return new JobView(j.getId().toString(), j.getKind(), j.getStatus(), j.getProgress(), j.getError());
        }
    }
    public record SceneView(String id, int order, String title, String caption, String imageUrl) {}

    private UUID familyOf(Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        FamilyEntity f = families.findFirstByOwnerId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "لا توجد عائلة"));
        return f.getId();
    }

    private StoryEntity ownedStory(Authentication auth, UUID id) {
        StoryEntity s = stories.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "الحكاية غير موجودة"));
        if (!s.getFamilyId().equals(familyOf(auth)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ليست ضمن عائلتك");
        return s;
    }

    /** يبدأ توليد المشاهد ويرجع jobId فورًا (العمل في الخلفية). */
    @PostMapping("/stories/{storyId}/scenes/generate")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public JobView generate(Authentication auth, @PathVariable UUID storyId, @RequestBody(required = false) GenerateRequest req) {
        StoryEntity s = ownedStory(auth, storyId);
        int count = (req != null && req.sceneCount() != null) ? Math.max(1, Math.min(8, req.sceneCount())) : 4;

        GenerationJobEntity job = new GenerationJobEntity();
        job.setStoryId(storyId);
        job.setKind("scene_image");
        job.setStatus("queued");
        job = jobs.save(job);

        s.setStatus("rendering");
        stories.save(s);

        generation.generate(job.getId(), storyId, s.getFamilyId(), count);
        return JobView.of(job);
    }

    @GetMapping("/jobs/{id}")
    public JobView job(Authentication auth, @PathVariable UUID id) {
        GenerationJobEntity j = jobs.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "المهمة غير موجودة"));
        ownedStory(auth, j.getStoryId()); // تحقق الملكية
        return JobView.of(j);
    }

    public record FilmView(String videoUrl, boolean ready) {}
    public record BookView(String pdfUrl, boolean ready) {}

    /** رابط الفيلم المُركّب (MP4) إن جهز. */
    @GetMapping("/stories/{storyId}/film")
    public FilmView film(Authentication auth, @PathVariable UUID storyId) {
        ownedStory(auth, storyId);
        return media.findFirstByStoryIdAndKindOrderByCreatedAtDesc(storyId, "video")
            .map(a -> new FilmView(storage.presignGet(a.getStorageKey()), true))
            .orElse(new FilmView(null, false));
    }

    /** رابط الكتاب المصوّر (PDF) إن جهز. */
    @GetMapping("/stories/{storyId}/book")
    public BookView book(Authentication auth, @PathVariable UUID storyId) {
        ownedStory(auth, storyId);
        return media.findFirstByStoryIdAndKindOrderByCreatedAtDesc(storyId, "book")
            .map(a -> new BookView(storage.presignGet(a.getStorageKey()), true))
            .orElse(new BookView(null, false));
    }

    @GetMapping("/stories/{storyId}/scenes")
    public List<SceneView> scenes(Authentication auth, @PathVariable UUID storyId) {
        ownedStory(auth, storyId);
        return scenes.findByStoryIdOrderBySceneOrder(storyId).stream()
            .map(sc -> new SceneView(sc.getId().toString(), sc.getSceneOrder(), sc.getTitle(), sc.getCaption(),
                sc.getImageKey() != null ? storage.presignGet(sc.getImageKey()) : null))
            .toList();
    }
}
