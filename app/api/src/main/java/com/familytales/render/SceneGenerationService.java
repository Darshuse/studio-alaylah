package com.familytales.render;

import com.familytales.character.CharacterProfileEntity;
import com.familytales.character.CharacterProfileRepository;
import com.familytales.media.MediaAssetEntity;
import com.familytales.media.MediaAssetRepository;
import com.familytales.media.StorageService;
import com.familytales.story.StoryRepository;
import com.familytales.story.StoryRevisionRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * خط التوليد في الخلفية (Job Queue): توليد صور المشاهد ثم تركيب فيلم MP4 حقيقي.
 * العميل يستقبل jobId فورًا ثم يستطلع الحالة.
 */
@Service
public class SceneGenerationService {

    private final StorySceneRepository scenes;
    private final GenerationJobRepository jobs;
    private final CharacterProfileRepository characters;
    private final ImageProviderChain imageProvider;
    private final StorageService storage;
    private final VideoService video;
    private final MediaAssetRepository media;
    private final StoryRevisionRepository revisions;
    private final StoryboardService storyboard;
    private final TranslationService translation;
    private final BookService book;
    private final StoryRepository stories2;
    private final ObjectProvider<TtsProvider> ttsProvider; // اختياري: موجود فقط عند tts.provider=elevenlabs

    // بادئة تركيب اللقطة (تمنع انحياز البورتريه) + واصف الأسلوب لاحقًا
    private static final String COMPOSITION = "Wide cinematic storybook scene, full view, showing the whole action: ";
    private static final String STYLE = ", warm watercolor children's book illustration, earthy terracotta and sage palette, "
        + "soft golden afternoon light, detailed background, wide establishing shot, consistent character design, "
        + "tasteful and modest, no text, no watermark";

    public SceneGenerationService(StorySceneRepository scenes, GenerationJobRepository jobs,
                                  CharacterProfileRepository characters, ImageProviderChain imageProvider,
                                  StorageService storage, VideoService video, MediaAssetRepository media,
                                  StoryRevisionRepository revisions, StoryboardService storyboard,
                                  TranslationService translation, BookService book, StoryRepository stories2,
                                  ObjectProvider<TtsProvider> ttsProvider) {
        this.scenes = scenes;
        this.jobs = jobs;
        this.characters = characters;
        this.imageProvider = imageProvider;
        this.storage = storage;
        this.video = video;
        this.media = media;
        this.revisions = revisions;
        this.storyboard = storyboard;
        this.translation = translation;
        this.book = book;
        this.stories2 = stories2;
        this.ttsProvider = ttsProvider;
    }

    /** يعالج مهمة التوليد (يستدعيه مستهلك الطابور، بلا @Async — الطابور يوفّر التزامن). */
    public void process(UUID jobId, UUID storyId, UUID familyId, int sceneCount, boolean watermark) {
        GenerationJobEntity job = jobs.findById(jobId).orElseThrow();
        try {
            job.setStatus("processing");
            jobs.save(job);

            // بذرة ثبات الهوية عبر المشاهد
            List<CharacterProfileEntity> fam = characters.findByFamilyIdOrderByCreatedAt(familyId);
            String identitySeed = fam.stream().findFirst()
                .map(c -> c.getIdentitySeed() != null ? c.getIdentitySeed() : c.getId().toString())
                .orElse(storyId.toString());

            // نص الحكاية المعتمد + أسماء الأبطال
            String storyText = revisions.findFirstByStoryIdOrderByCreatedAtDesc(storyId)
                .map(r -> r.getBody()).orElse("ذكرى عائلية دافئة");
            List<String> names = fam.stream()
                .map(c -> c.getDisplayName() + (c.getAgeLabel() != null ? " (" + c.getAgeLabel() + ")" : ""))
                .collect(Collectors.toList());
            String charSuffix = names.isEmpty() ? "" : ", featuring " + translation.toEnglish(String.join("، ", names));

            // مرساة ثبات الشخصية: وصف البطل من مطلع القصة (يُترجم مرة ويُحقن في كل مشهد)
            // يمنع الموديل من اختراع شخصية جديدة (مثل طفل بشري بدل شبل الأسد) في مشاهد الحدث
            String opening = firstSentences(storyText, 2);
            String castEn = translation.toEnglish(opening);

            // صور مرجعية لحقن هوية الطفل الحقيقي (أفاتار كرتوني من صورته) في كل مشهد
            List<byte[]> refImages = new ArrayList<>();
            if (imageProvider.supportsReferences()) {
                for (CharacterProfileEntity c : fam) {
                    if (c.getAvatarKey() != null) {
                        try { refImages.add(storage.getBytes(c.getAvatarKey())); } catch (Exception ignored) {}
                    }
                }
            }
            boolean hasRefs = !refImages.isEmpty();

            // لوحة قصصية حقيقية: وصف بصري لكل مشهد
            List<String> scenePrompts = storyboard.build(storyText, names, sceneCount);

            scenes.deleteByStoryId(storyId);

            // 1) توليد صور المشاهد الحقيقية (0 → 70٪)
            List<byte[]> pngs = new ArrayList<>();
            for (int i = 1; i <= sceneCount; i++) {
                String desc = scenePrompts.get(i - 1);
                StorySceneEntity sc = new StorySceneEntity();
                sc.setStoryId(storyId);
                sc.setSceneOrder(i);
                sc.setTitle("المشهد " + i);
                sc.setCaption(desc.length() > 120 ? desc.substring(0, 120) : desc); // العربي للعرض
                sc = scenes.save(sc);

                // وصف بصري إنجليزي دقيق للمشهد (LLM يتحمّل العامية + تكوين أدق من الترجمة الحرفية)
                String descEn = translation.toScenePrompt(desc);
                // المرساة أولًا: البطل ثابت في كل مشهد، ثم حدث المشهد الحالي
                String anchor = hasRefs
                    ? "The main character is the person shown in the reference image — keep the same face, age and appearance. "
                    : "Recurring main character kept visually identical in every scene — " + castEn + charSuffix + ". ";
                String prompt = COMPOSITION + anchor + "This scene shows: " + descEn + STYLE;
                // seed مختلف لكل مشهد (تنوّع + مناعة من الـseed السيّئ)، مشتق من هوية العائلة
                byte[] png = imageProvider.generateScene(prompt, identitySeed + "#" + i,
                    hasRefs ? refImages : null);
                pngs.add(png);
                boolean jpeg = png.length > 3 && (png[0] & 0xFF) == 0xFF && (png[1] & 0xFF) == 0xD8;
                String ext = jpeg ? "jpg" : "png";
                String key = "families/" + familyId + "/stories/" + storyId + "/scenes/" + i + "." + ext;
                storage.putBytes(key, png, jpeg ? "image/jpeg" : "image/png");
                sc.setImageKey(key);
                scenes.save(sc);

                job.setProgress((int) Math.round(i * 70.0 / sceneCount));
                jobs.save(job);
            }

            // 2) إحضار تسجيل الأب الصوتي (إن وُجد) — يُستخدم كعيّنة استنساخ أو كسرد خام
            MediaAssetEntity audioAsset = media.findFirstByStoryIdAndKindOrderByCreatedAtDesc(storyId, "audio").orElse(null);
            byte[] audio = null;
            String audioCt = null;
            if (audioAsset != null) {
                try { audio = storage.getBytes(audioAsset.getStorageKey()); audioCt = audioAsset.getContentType(); }
                catch (Exception e) { audio = null; }
            }

            job.setProgress(75);
            jobs.save(job);

            // 3) تركيب الفيلم MP4 (75 → 90٪) — السرد بصوت الأب على كل مشهد
            TtsProvider tts = ttsProvider.getIfAvailable();
            // (أ) صوت الأب مسجّل مسبقًا على بطاقته (نسخة دائمة) → يُسرد به أي قصة
            String narratorVoiceId = fam.stream()
                .map(CharacterProfileEntity::getVoiceId).filter(v -> v != null && !v.isBlank())
                .findFirst().orElse(null);

            // (ب) لا نسخة دائمة → استنسخ مؤقتًا من أفضل عيّنة متاحة:
            //     صوت هذه القصة إن وُجد، وإلا أحدث تسجيل صوتي في الأرشيف (قصص سابقة).
            String ephemeralVoiceId = null;
            if (tts != null && narratorVoiceId == null) {
                MediaAssetEntity sampleAsset = (audioAsset != null) ? audioAsset
                    : media.findFirstByFamilyIdAndKindOrderByCreatedAtDesc(familyId, "audio").orElse(null);
                if (sampleAsset != null) {
                    try {
                        byte[] sample = storage.getBytes(sampleAsset.getStorageKey());
                        ephemeralVoiceId = tts.cloneVoice("FamilyTales-" + storyId, sample, sampleAsset.getContentType());
                        narratorVoiceId = ephemeralVoiceId;
                    } catch (Exception ignored) { /* تعذّر الاستنساخ → فيلم صامت */ }
                }
            }

            byte[] mp4;
            try {
                if (tts != null && narratorVoiceId != null) {
                    mp4 = narrateScenes(tts, narratorVoiceId, scenePrompts, pngs, job, watermark);
                } else {
                    mp4 = video.assemble(pngs, audio, watermark); // لا صوت → فيلم بمدد ثابتة
                }
            } catch (Exception e) {
                mp4 = video.assemble(pngs, audio, watermark); // فشل السرد → لا يُفشل الفيلم
            } finally {
                if (ephemeralVoiceId != null) tts.deleteVoice(ephemeralVoiceId); // تنظيف النسخة المؤقتة
            }
            String videoKey = "families/" + familyId + "/stories/" + storyId + "/film.mp4";
            storage.putBytes(videoKey, mp4, "video/mp4");
            saveAsset(familyId, storyId, "video", videoKey, "video/mp4", mp4.length);

            job.setProgress(90);
            jobs.save(job);

            // 4) بناء الكتاب المصوّر PDF (90 → 100٪)
            try {
                String title = stories2.findById(storyId).map(s -> s.getTitle()).filter(t -> t != null && !t.isBlank())
                    .orElse("حكايتنا العائلية");
                byte[] pdf = book.assemble(title, scenePrompts.isEmpty() ? "" : scenePrompts.get(0), pngs, scenePrompts);
                String bookKey = "families/" + familyId + "/stories/" + storyId + "/book.pdf";
                storage.putBytes(bookKey, pdf, "application/pdf");
                saveAsset(familyId, storyId, "book", bookKey, "application/pdf", pdf.length);
            } catch (Exception be) {
                // فشل الكتاب لا يُفشل المهمة كلها — الفيلم جاهز
            }

            job.setStatus("completed");
            job.setProgress(100);
            jobs.save(job);
        } catch (Exception e) {
            job.setStatus("failed");
            job.setError(e.getMessage() != null ? e.getMessage() : e.toString());
            jobs.save(job);
        }
    }

    /**
     * ينطق نص كل مشهد بصوت النسخة المحدّدة (voiceId) ويركّب فيلمًا متزامنًا (مدّة المشهد = مدّة سرده).
     * مشهد يفشل سرده → صامت بمدّة ثابتة (لا يُفشل الفيلم كله).
     */
    private byte[] narrateScenes(TtsProvider tts, String voiceId, List<String> sceneTexts,
                                 List<byte[]> pngs, GenerationJobEntity job, boolean watermark)
            throws Exception {
        List<byte[]> narrations = new ArrayList<>();
        for (int i = 0; i < pngs.size(); i++) {
            String line = i < sceneTexts.size() ? sceneTexts.get(i) : "";
            byte[] clip = null;
            if (line != null && !line.isBlank()) {
                try { clip = tts.synthesize(line, voiceId); }
                catch (Exception e) { clip = null; }
            }
            narrations.add(clip);
            job.setProgress(75 + (int) Math.round((i + 1) * 10.0 / pngs.size())); // 75 → 85٪
            jobs.save(job);
        }
        return video.assembleWithNarration(pngs, narrations, watermark);
    }

    /** أول جملتين من النص (تقديم البطل والمكان) لاستخدامهما كمرساة ثبات الشخصية. */
    private static String firstSentences(String text, int n) {
        if (text == null || text.isBlank()) return "a warm family memory";
        String[] parts = text.trim().split("(?<=[.!؟\\n])");
        StringBuilder sb = new StringBuilder();
        int taken = 0;
        for (String p : parts) {
            String t = p.trim();
            if (t.length() < 3) continue;
            if (sb.length() > 0) sb.append(" ");
            sb.append(t);
            if (++taken >= n) break;
        }
        String out = sb.toString().trim();
        return out.isEmpty() ? text.trim() : out;
    }

    private void saveAsset(UUID familyId, UUID storyId, String kind, String key, String ct, long bytes) {
        MediaAssetEntity a = new MediaAssetEntity();
        a.setFamilyId(familyId);
        a.setStoryId(storyId);
        a.setKind(kind);
        a.setStorageKey(key);
        a.setContentType(ct);
        a.setBytes(bytes);
        media.save(a);
    }
}
