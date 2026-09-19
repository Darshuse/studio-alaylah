package com.familytales.render;

/**
 * مزوّد تحويل نص→صوت مع استنساخ صوت الأب.
 * التدفق: cloneVoice(عيّنة صوت الأب) → voiceId، ثم synthesize(نص المشهد, voiceId) لكل مشهد،
 * وأخيرًا deleteVoice للتنظيف (البقاء ضمن حد الأصوات لدى المزوّد).
 */
public interface TtsProvider {

    /** اسم المزوّد للتشخيص. */
    String name();

    /**
     * ينشئ نسخة صوتية من عيّنة صوت الأب.
     * @param label     اسم مميّز للنسخة (يُعرض في لوحة المزوّد)
     * @param sample    بايتات عيّنة الصوت (webm/mp3/wav)
     * @param sampleContentType نوع محتوى العيّنة
     * @return معرّف الصوت (voiceId) لدى المزوّد
     */
    String cloneVoice(String label, byte[] sample, String sampleContentType) throws Exception;

    /** يحوّل نصًا عربيًا إلى صوت بصوت النسخة المحدّدة. يُرجع بايتات MP3. */
    byte[] synthesize(String text, String voiceId) throws Exception;

    /** يحذف النسخة الصوتية بعد الاستخدام (تنظيف). لا يرمي إن فشل الحذف. */
    void deleteVoice(String voiceId);
}
