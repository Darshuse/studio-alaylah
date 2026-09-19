package com.familytales.render;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * ترجمة عربي→إنجليزي عبر MyMemory (مجاني، بلا مفتاح) لتحسين دقة توليد الصور.
 * عند الفشل يرجّع النص الأصلي (السلوك يبقى شغّالًا).
 */
@Service
public class TranslationService {

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    private final ObjectMapper mapper = new ObjectMapper();

    public String toEnglish(String arabic) {
        if (arabic == null || arabic.isBlank()) return arabic;
        String text = arabic.length() > 480 ? arabic.substring(0, 480) : arabic;
        try {
            String url = "https://api.mymemory.translated.net/get?langpair=ar|en&q="
                + URLEncoder.encode(text, StandardCharsets.UTF_8);
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(20)).GET().build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (res.statusCode() == 200) {
                JsonNode root = mapper.readTree(res.body());
                String out = root.path("responseData").path("translatedText").asText("");
                if (!out.isBlank() && !out.toUpperCase().contains("MYMEMORY WARNING")) return out.trim();
            }
        } catch (Exception ignored) { }
        return arabic;
    }
}
