package com.familytales.render;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

/**
 * مزوّد fal.ai (Flux) — جودة عالية بلا علامة مائية.
 * يُفعّل بـ image.provider=fal ويحتاج FAL_KEY. النموذج الافتراضي fal-ai/flux/dev.
 */
@Component
@ConditionalOnProperty(name = "image.provider", havingValue = "fal")
public class FalImageProvider implements ImageProvider {

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final String key;
    private final String model;

    public FalImageProvider(@Value("${image.fal.key:}") String key,
                            @Value("${image.fal.model:fal-ai/flux/dev}") String model) {
        this.key = key;
        this.model = model;
    }

    @Override
    public String name() { return "fal:" + model; }

    @Override
    public byte[] generateScene(String prompt, String identitySeed) throws Exception {
        if (key == null || key.isBlank())
            throw new IllegalStateException("FAL_KEY غير مضبوط — أضِف مفتاح fal.ai لتفعيل الجودة العالية.");

        long seed = Math.abs((identitySeed == null ? "seed" : identitySeed).hashCode());

        ObjectNode body = mapper.createObjectNode();
        body.put("prompt", prompt);
        body.put("image_size", "landscape_16_9");
        body.put("num_images", 1);
        body.put("num_inference_steps", 28);
        body.put("enable_safety_checker", true);
        body.put("seed", seed % 2_000_000);

        HttpRequest req = HttpRequest.newBuilder(URI.create("https://fal.run/" + model))
            .timeout(Duration.ofSeconds(150))
            .header("Authorization", "Key " + key)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body.toString(), StandardCharsets.UTF_8))
            .build();

        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (res.statusCode() != 200)
            throw new RuntimeException("fal.ai status " + res.statusCode() + ": "
                + (res.body() != null ? res.body().substring(0, Math.min(300, res.body().length())) : ""));

        JsonNode root = mapper.readTree(res.body());
        JsonNode images = root.path("images");
        if (!images.isArray() || images.isEmpty())
            throw new RuntimeException("fal.ai لم يُرجِع صورة: " + res.body().substring(0, Math.min(200, res.body().length())));
        String url = images.get(0).path("url").asText("");
        if (url.isBlank()) throw new RuntimeException("fal.ai رابط صورة فارغ");

        // fal قد يرجع data URI (base64) أو رابط
        if (url.startsWith("data:")) {
            String b64 = url.substring(url.indexOf(',') + 1);
            return java.util.Base64.getDecoder().decode(b64);
        }
        HttpRequest imgReq = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(60)).GET().build();
        HttpResponse<byte[]> imgRes = http.send(imgReq, HttpResponse.BodyHandlers.ofByteArray());
        if (imgRes.statusCode() != 200 || imgRes.body().length < 1000)
            throw new RuntimeException("فشل تنزيل صورة fal (" + imgRes.statusCode() + ")");
        return imgRes.body();
    }
}
