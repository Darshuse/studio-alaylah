package com.familytales.character;

import com.familytales.family.FamilyEntity;
import com.familytales.family.FamilyRepository;
import com.familytales.media.StorageService;
import com.familytales.render.ImageProvider;
import com.familytales.render.TtsProvider;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/** إدارة أبطال العائلة (بطاقات الشخصيات) + صورة الطفل والأفاتار الكرتوني. */
@RestController
@RequestMapping("/api/v1/characters")
public class CharacterController {

    /**
     * برومبت تحويل الصورة الحقيقية → شخصية كرتونية — **حسب السن والدور**:
     * بالغ → رجل/سيدة كرتوني، طفل → طفل. يحافظ على الوش والسن واللحية قريبًا من الصورة.
     */
    private static String avatarPrompt(CharacterProfileEntity c) {
        // ندمج الاسم مع وصف السن (اسم مثل «أبو محمد»/«أم أحمد» يدلّ على الدور والنوع)
        String hint = (c.getAgeLabel() == null ? "" : c.getAgeLabel()) + " " + (c.getDisplayName() == null ? "" : c.getDisplayName());
        String subject = ageSubject(hint);
        // مُحسّن لـ Kontext: «حوّل هذا الشخص بالذات» → حفاظ أقوى على هوية الوش
        return "Turn this exact " + subject + " into a warm watercolor storybook cartoon character. "
            + "Keep the identical face shape, features, eyes, nose, hairstyle, facial hair/beard if present, "
            + "skin tone and real age — do NOT make them look younger or older, do NOT change their identity. "
            + "Gentle friendly expression, soft golden light, plain background, tasteful and modest, no text, no watermark";
    }

    /** يستنتج نوع الشخص (بالغ رجل/سيدة أو طفل) من وصف السن/الدور العربي. */
    static String ageSubject(String ageLabel) {
        String s = ageLabel == null ? "" : ageLabel.trim();
        String lower = s.toLowerCase();
        boolean male = s.matches(".*(أب|ابو|أبو|بابا|جد|عم|خال|زوج|رجل|والد|اخو|أخو|ابن).*");
        boolean female = s.matches(".*(أم|امي|أمي|ماما|جدة|عمة|خالة|زوجة|امرأة|سيدة|بنت|والدة|اخت|أخت).*");
        int age = extractAge(s);
        boolean adult = age >= 18 || s.matches(".*(الثلاثين|الأربعين|الخمسين|الستين|بالغ|كبير).*")
            || (age < 0 && (s.contains("أب") || s.contains("أم") || s.contains("جد") || s.contains("عم") || s.contains("خال")));
        boolean child = (age >= 0 && age < 13) || s.matches(".*(طفل|رضيع|سنوات|سنه|سنة).*") && age > 0 && age < 13;

        if (adult && male) return "grown adult man (do not depict as a child)";
        if (adult && female) return "grown adult woman (do not depict as a child)";
        if (adult) return "grown adult person of the same age and gender as in the photo (do not depict as a child)";
        if (age >= 13 && age < 18) return "teenager of the same gender as in the photo";
        if (child || (age >= 0 && age < 13)) return "young child";
        // غير معروف → اترك الصورة تحدّد السن والنوع
        return "person of the exact same age and gender as shown in the reference photo";
    }

    /** يستخرج أول رقم سن من نص عربي/إنجليزي (يدعم الأرقام العربية-الهندية). */
    static int extractAge(String s) {
        if (s == null || s.isEmpty()) return -1;
        StringBuilder norm = new StringBuilder();
        for (char ch : s.toCharArray()) {
            if (ch >= '٠' && ch <= '٩') norm.append((char) ('0' + (ch - '٠'))); // عربية-هندية
            else norm.append(ch);
        }
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\d{1,3}").matcher(norm.toString());
        return m.find() ? Integer.parseInt(m.group()) : -1;
    }

    private final CharacterProfileRepository characters;
    private final FamilyRepository families;
    private final StorageService storage;
    private final ImageProvider imageProvider;
    private final ObjectProvider<TtsProvider> ttsProvider; // موجود فقط عند tts.provider=elevenlabs

    public CharacterController(CharacterProfileRepository characters, FamilyRepository families,
                              StorageService storage, ImageProvider imageProvider,
                              ObjectProvider<TtsProvider> ttsProvider) {
        this.characters = characters;
        this.families = families;
        this.storage = storage;
        this.imageProvider = imageProvider;
        this.ttsProvider = ttsProvider;
    }

    public record CreateCharacterRequest(@NotBlank String displayName, String ageLabel) {}
    public record CharacterView(String id, String displayName, String ageLabel, boolean identityReady,
                                boolean hasPhoto, String avatarUrl, boolean voiceReady) {}
    public record PhotoUploadRequest(@NotBlank String contentType) {}
    public record PhotoUploadTicket(String key, String uploadUrl) {}
    public record AvatarView(String avatarUrl, boolean identityReady) {}
    public record VoiceView(boolean voiceReady) {}

    private CharacterView view(CharacterProfileEntity c) {
        return new CharacterView(c.getId().toString(), c.getDisplayName(), c.getAgeLabel(), c.isIdentityReady(),
            c.getPhotoKey() != null,
            c.getAvatarKey() != null ? storage.presignGet(c.getAvatarKey()) : null,
            c.getVoiceId() != null);
    }

    private UUID familyOf(Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        FamilyEntity f = families.findFirstByOwnerId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "لا توجد عائلة"));
        return f.getId();
    }

    private CharacterProfileEntity owned(Authentication auth, UUID id) {
        CharacterProfileEntity c = characters.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "غير موجود"));
        if (!c.getFamilyId().equals(familyOf(auth)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ليست ضمن عائلتك");
        return c;
    }

    @GetMapping
    public List<CharacterView> list(Authentication auth) {
        return characters.findByFamilyIdOrderByCreatedAt(familyOf(auth))
            .stream().map(this::view).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CharacterView create(Authentication auth, @org.springframework.web.bind.annotation.RequestBody CreateCharacterRequest req) {
        CharacterProfileEntity c = new CharacterProfileEntity();
        c.setFamilyId(familyOf(auth));
        c.setDisplayName(req.displayName());
        c.setAgeLabel(req.ageLabel());
        c.setIdentitySeed(UUID.randomUUID().toString()); // بذرة ثبات الهوية عبر المشاهد
        c.setIdentityReady(false);
        return view(characters.save(c));
    }

    /** يطلب رابط رفع موقّع لصورة الطفل، ويثبّت مفتاحها على الشخصية. */
    @PostMapping("/{id}/photo")
    public PhotoUploadTicket requestPhotoUpload(Authentication auth, @PathVariable UUID id,
                                                @org.springframework.web.bind.annotation.RequestBody PhotoUploadRequest req) {
        CharacterProfileEntity c = owned(auth, id);
        String ct = req.contentType();
        if (ct == null || !(ct.equals("image/png") || ct.equals("image/jpeg") || ct.equals("image/webp")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "نوع صورة غير مدعوم (PNG/JPEG/WEBP فقط)");
        String ext = ct.equals("image/png") ? "png" : ct.equals("image/webp") ? "webp" : "jpg";
        String key = "families/" + c.getFamilyId() + "/characters/" + id + "/photo." + ext;
        String url = storage.presignPut(key, ct);
        c.setPhotoKey(key);
        characters.save(c);
        return new PhotoUploadTicket(key, url);
    }

    /** يحوّل صورة الطفل المرفوعة إلى أفاتار كرتوني ويخزّنه (الميزة الحاسمة: طفلك بطل الحكاية). */
    @PostMapping("/{id}/avatar")
    public AvatarView generateAvatar(Authentication auth, @PathVariable UUID id) {
        CharacterProfileEntity c = owned(auth, id);
        if (c.getPhotoKey() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ارفع صورة الطفل أولًا");
        if (!imageProvider.supportsReferences())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "مزوّد الصور الحالي لا يدعم تحويل الصور — فعّل Together (FLUX.2)");
        try {
            byte[] photo = storage.getBytes(c.getPhotoKey());
            String ct = c.getPhotoKey().endsWith(".png") ? "image/png"
                : c.getPhotoKey().endsWith(".webp") ? "image/webp" : "image/jpeg";
            byte[] avatar = imageProvider.editToAvatar(avatarPrompt(c), photo, ct);
            String key = "families/" + c.getFamilyId() + "/characters/" + id + "/avatar.png";
            storage.putBytes(key, avatar, "image/png");
            c.setAvatarKey(key);
            c.setIdentityReady(true);
            characters.save(c);
            return new AvatarView(storage.presignGet(key), true);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "فشل توليد الأفاتار: " + e.getMessage());
        }
    }

    /** يطلب رابط رفع موقّع لعيّنة صوت الأب، ويثبّت مفتاحها على الشخصية. */
    @PostMapping("/{id}/voice")
    public PhotoUploadTicket requestVoiceUpload(Authentication auth, @PathVariable UUID id,
                                                @org.springframework.web.bind.annotation.RequestBody PhotoUploadRequest req) {
        CharacterProfileEntity c = owned(auth, id);
        String ct = req.contentType();
        if (ct == null || !ct.startsWith("audio/"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "نوع صوت غير مدعوم");
        String ext = ct.contains("mpeg") || ct.contains("mp3") ? "mp3"
            : ct.contains("wav") ? "wav" : ct.contains("mp4") || ct.contains("m4a") ? "m4a"
            : ct.contains("ogg") ? "ogg" : "webm";
        String key = "families/" + c.getFamilyId() + "/characters/" + id + "/voice-sample." + ext;
        String url = storage.presignPut(key, ct);
        c.setVoiceSampleKey(key);
        characters.save(c);
        return new PhotoUploadTicket(key, url);
    }

    /** يستنسخ صوت الأب من عيّنته المرفوعة ويحفظ نسخة دائمة (تُسرد بها كل القصص). */
    @PostMapping("/{id}/voice/clone")
    public VoiceView cloneVoice(Authentication auth, @PathVariable UUID id) {
        CharacterProfileEntity c = owned(auth, id);
        if (c.getVoiceSampleKey() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "سجّل صوت الأب أولًا");
        TtsProvider tts = ttsProvider.getIfAvailable();
        if (tts == null)
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "استنساخ الصوت غير مفعّل — فعّل ElevenLabs");
        try {
            // نسخة قديمة؟ احذفها قبل إنشاء جديدة (تجنّب تراكم الأصوات)
            if (c.getVoiceId() != null) tts.deleteVoice(c.getVoiceId());
            byte[] sample = storage.getBytes(c.getVoiceSampleKey());
            String ct = c.getVoiceSampleKey().endsWith(".mp3") ? "audio/mpeg"
                : c.getVoiceSampleKey().endsWith(".wav") ? "audio/wav"
                : c.getVoiceSampleKey().endsWith(".m4a") ? "audio/mp4"
                : c.getVoiceSampleKey().endsWith(".ogg") ? "audio/ogg" : "audio/webm";
            String voiceId = tts.cloneVoice("FamilyTales-" + c.getDisplayName() + "-" + id, sample, ct);
            c.setVoiceId(voiceId);
            characters.save(c);
            return new VoiceView(true);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "فشل استنساخ الصوت: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication auth, @PathVariable UUID id) {
        CharacterProfileEntity c = owned(auth, id);
        TtsProvider tts = ttsProvider.getIfAvailable();
        if (tts != null && c.getVoiceId() != null) tts.deleteVoice(c.getVoiceId()); // تنظيف النسخة الصوتية
        characters.delete(c);
    }
}
