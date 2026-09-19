package com.familytales.render;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * مزوّد Replicate الحقيقي — يُفعّل بـ image.provider=replicate ويحتاج REPLICATE_API_TOKEN.
 * الهيكل جاهز؛ نداء الـHTTP الفعلي يُكمَّل ويُختبر عند توفّر المفتاح (لم يُختبر بعد).
 *
 * التدفّق القياسي (Replicate predictions API):
 *   POST https://api.replicate.com/v1/predictions
 *     Authorization: Bearer $REPLICATE_API_TOKEN
 *     { "version": "<sdxl+ip-adapter/lora version>",
 *       "input": { "prompt": prompt, "seed": identitySeed→int, "image": referenceUrl } }
 *   ثم poll GET /v1/predictions/{id} حتى status=succeeded → output[0] (رابط الصورة) → نزّل البايتات.
 * ثبات الهوية: seed ثابت + صورة/LoRA مرجعية لكل شخصية عبر كل المشاهد.
 */
@Component
@ConditionalOnProperty(name = "image.provider", havingValue = "replicate")
public class ReplicateImageProvider implements ImageProvider {

    private final String token;

    public ReplicateImageProvider(@Value("${image.replicate.token:}") String token) {
        this.token = token;
    }

    @Override
    public String name() { return "replicate"; }

    @Override
    public byte[] generateScene(String prompt, String identitySeed) throws Exception {
        if (token == null || token.isBlank())
            throw new IllegalStateException("REPLICATE_API_TOKEN غير مضبوط — أضِف المفتاح لتفعيل التوليد الحقيقي.");
        // TODO: نفّذ نداء predictions + poll + تنزيل البايتات هنا (يُختبر مع المفتاح).
        throw new UnsupportedOperationException("نداء Replicate الفعلي لم يُنفَّذ/يُختبر بعد — يُكمَّل عند توفّر المفتاح.");
    }
}
