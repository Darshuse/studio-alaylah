package com.familytales.render;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * مزوّد صور مجاني (Pollinations، بلا مفتاح): يولّد رسمة حقيقية لكل مشهد.
 * ثبات الهوية تقريبيًا عبر seed ثابت + وصف موحّد للشخصيات في كل prompt.
 * ملاحظة: الـprompts تُرسَل لخدمة عامة — للإنتاج يُفضّل مزوّد خاص.
 */
@Component
@ConditionalOnProperty(name = "image.provider", havingValue = "pollinations")
public class PollinationsImageProvider implements ImageProvider {

    private final HttpClient http = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(20)).build();

    @Override
    public String name() { return "pollinations"; }

    @Override
    public byte[] generateScene(String prompt, String identitySeed) throws Exception {
        int seed = Math.abs((identitySeed == null ? "seed" : identitySeed).hashCode()) % 1_000_000;
        String encoded = URLEncoder.encode(prompt, StandardCharsets.UTF_8);
        String url = "https://image.pollinations.ai/prompt/" + encoded
            + "?width=1280&height=720&nologo=true&model=flux&seed=" + seed;

        Exception last = null;
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(150))
                    .header("Accept", "image/jpeg,image/png")
                    .GET().build();
                HttpResponse<byte[]> res = http.send(req, HttpResponse.BodyHandlers.ofByteArray());
                if (res.statusCode() == 200 && res.body().length > 2000) return res.body();
                last = new RuntimeException("Pollinations status " + res.statusCode() + " / " + res.body().length + "B");
            } catch (Exception e) {
                last = e;
            }
            Thread.sleep(2000);
        }
        throw new RuntimeException("فشل توليد صورة المشهد: " + (last != null ? last.getMessage() : "غير معروف"));
    }
}
