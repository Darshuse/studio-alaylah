package com.familytales.render;

import java.util.List;

/**
 * مزوّد توليد الصور — خلف واجهة مجرّدة (نبدّل Mock ↔ Together/fal.ai دون لمس منطق العمل).
 * identitySeed = بذرة ثبات هوية الشخصية عبر المشاهد (الميزة الحاسمة).
 */
public interface ImageProvider {
    byte[] generateScene(String prompt, String identitySeed) throws Exception;
    String name();

    /** هل يدعم المزوّد صورًا مرجعية (حقن هوية الطفل من صورته)؟ */
    default boolean supportsReferences() { return false; }

    /**
     * توليد مشهد مع صور مرجعية (وجه الطفل) لحقن هويته في المشهد.
     * الافتراضي يتجاهل المراجع (للمزوّدات التي لا تدعمها).
     */
    default byte[] generateScene(String prompt, String identitySeed, List<byte[]> references) throws Exception {
        return generateScene(prompt, identitySeed);
    }

    /**
     * تحويل صورة (صورة الطفل الحقيقية) إلى شخصية كرتونية بأسلوب القصة (image-to-image).
     * يرمي UnsupportedOperationException للمزوّدات التي لا تدعمها.
     */
    default byte[] editToAvatar(String prompt, byte[] photo, String photoContentType) throws Exception {
        throw new UnsupportedOperationException("هذا المزوّد لا يدعم تحويل الصور");
    }
}
