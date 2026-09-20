package com.familytales.render;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;

/**
 * مزوّد Together.ai (افتراضيًا FLUX.2-flex) — جودة Flux احترافية.
 * يُفعّل بـ image.provider=together ويحتاج TOGETHER_API_KEY + تفعيل third-party data sharing.
 * يعيد المحاولة تلقائيًا لو رجع خطأ مؤقت (مثل انتشار إعداد data-sharing عبر سيرفراتهم).
 */
@Component
@ConditionalOnProperty(name = "image.provider", havingValue = "together")
public class TogetherImageProvider implements ImageProvider {

    private static final int MAX_ATTEMPTS = 4;

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final String key;
    private final String model;
    private final String editModel;
    private final int steps;

    public TogetherImageProvider(@Value("${image.together.key:}") String key,
                                 @Value("${image.together.model:black-forest-labs/FLUX.2-flex}") String model,
                                 @Value("${image.together.edit-model:black-forest-labs/FLUX.1-kontext-pro}") String editModel,
                                 @Value("${image.together.steps:20}") int steps) {
        this.key = key;
        this.model = model;
        this.editModel = editModel;
        this.steps = steps;
    }

    @Override
    public String name() { return "together:" + model; }

    @Override
    public boolean supportsReferences() { return true; }

    @Override
    public byte[] generateScene(String prompt, String identitySeed) throws Exception {
        return generateScene(prompt, identitySeed, null);
    }

    /** توليد مشهد، مع حقن هوية الطفل من صور مرجعية (reference_images) إن وُجدت. */
    @Override
    public byte[] generateScene(String prompt, String identitySeed, List<byte[]> references) throws Exception {
        requireKey();
        long seed = Math.abs((identitySeed == null ? "seed" : identitySeed).hashCode()) % 2_000_000;
        ObjectNode body = baseBody(prompt, 1024, 576);
        body.put("seed", seed);
        if (references != null && !references.isEmpty()) {
            ArrayNode refs = body.putArray("reference_images");
            for (byte[] r : references) if (r != null && r.length > 0) refs.add(dataUri(r));
        }
        return send(body);
    }

    /**
     * تحويل صورة الشخص الحقيقية → شخصية كرتونية عالية الشبه.
     * يستخدم FLUX.1-Kontext (مصمّم للحفاظ على هوية الوش عند تغيير الأسلوب) بدل flex → شبه أعلى.
     */
    @Override
    public byte[] editToAvatar(String prompt, byte[] photo, String photoContentType) throws Exception {
        requireKey();
        if (photo == null || photo.length == 0) throw new IllegalArgumentException("لا توجد صورة للتحويل");
        String uri = dataUri(photo);
        // 1) نحاول Kontext (شبه أعلى) — يتطلّب رصيد Together
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", editModel);
            body.put("prompt", prompt);
            body.put("image_url", uri);
            return send(body);
        } catch (Exception kontextErr) {
            // 2) fallback: FLUX.2-flex image-editing (يعمل بلا رصيد إضافي، شبه جيد)
            ObjectNode body = baseBody(prompt, 1024, 1024);
            body.put("image_url", uri);
            return send(body);
        }
    }

    private void requireKey() {
        if (key == null || key.isBlank())
            throw new IllegalStateException("TOGETHER_API_KEY غير مضبوط — أضِف مفتاح Together.");
    }

    private ObjectNode baseBody(String prompt, int w, int h) {
        ObjectNode body = mapper.createObjectNode();
        body.put("model", model);
        body.put("prompt", prompt);
        body.put("width", w);
        body.put("height", h);
        body.put("steps", steps);
        body.put("n", 1);
        return body;
    }

    private static String dataUri(byte[] img) {
        boolean jpeg = img.length > 2 && (img[0] & 0xFF) == 0xFF && (img[1] & 0xFF) == 0xD8;
        return "data:" + (jpeg ? "image/jpeg" : "image/png") + ";base64," + Base64.getEncoder().encodeToString(img);
    }

    /** يرسل الطلب مع إعادة المحاولة على الأخطاء المؤقتة (403 انتشار/429/5xx/مهلة). */
    private byte[] send(ObjectNode body) throws Exception {
        Exception last = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.together.xyz/v1/images/generations"))
                .timeout(Duration.ofSeconds(180))
                .header("Authorization", "Bearer " + key)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString(), StandardCharsets.UTF_8))
                .build();

            try {
                HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (res.statusCode() == 200) return extractImage(res.body());

                String snippet = res.body() == null ? "" : res.body().substring(0, Math.min(300, res.body().length()));
                last = new RuntimeException("Together status " + res.statusCode() + ": " + snippet);
                // 403 data-sharing/انتشار الإعداد، و429 (rate) و5xx = مؤقتة → أعد المحاولة
                boolean retryable = res.statusCode() == 403 || res.statusCode() == 429 || res.statusCode() >= 500;
                if (!retryable || attempt == MAX_ATTEMPTS) break;
            } catch (java.io.IOException netErr) {
                // مهلة/شبكة (HttpTimeoutException ترث IOException) = مؤقتة → أعد المحاولة
                last = netErr;
                if (attempt == MAX_ATTEMPTS) break;
            }
            Thread.sleep(1500L * attempt);
        }
        if (last instanceof RuntimeException) throw (RuntimeException) last;
        throw new RuntimeException("Together فشل بعد " + MAX_ATTEMPTS + " محاولات: " + (last == null ? "?" : last.getMessage()), last);
    }

    private byte[] extractImage(String responseBody) throws Exception {
        JsonNode data = mapper.readTree(responseBody).path("data");
        if (!data.isArray() || data.isEmpty())
            throw new RuntimeException("Together لم يُرجِع صورة");
        JsonNode item = data.get(0);
        String b64 = item.path("b64_json").asText("");
        if (!b64.isBlank()) return Base64.getDecoder().decode(b64);

        String url = item.path("url").asText("");
        if (url.isBlank()) throw new RuntimeException("Together لا رابط/بيانات صورة");
        HttpResponse<byte[]> img = http.send(
            HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(60)).GET().build(),
            HttpResponse.BodyHandlers.ofByteArray());
        return img.body();
    }
}
