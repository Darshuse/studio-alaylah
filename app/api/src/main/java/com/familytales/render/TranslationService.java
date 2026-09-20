package com.familytales.render;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * تحويل نص المشهد العربي → برومبت إنجليزي بصري لتوليد الصور.
 * المسار المفضّل: LLM عبر Together (يتحمّل العامية والتعابير + يصف الحدث والتكوين بدقّة).
 * بديل: MyMemory (ترجمة حرفية مجانية). الأخير: النص كما هو. السلوك يبقى شغّالًا دائمًا.
 */
@Service
public class TranslationService {

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final String togetherKey;
    private final String llmModel;
    private final boolean useLlm;

    public TranslationService(@Value("${image.together.key:}") String togetherKey,
                              @Value("${translation.llm-model:meta-llama/Llama-3.3-70B-Instruct-Turbo}") String llmModel,
                              @Value("${translation.use-llm:true}") boolean useLlm) {
        this.togetherKey = togetherKey;
        this.llmModel = llmModel;
        this.useLlm = useLlm;
    }

    /**
     * يحوّل جملة المشهد العربية إلى برومبت بصري إنجليزي دقيق (subject + action + setting + mood).
     * أدقّ من الترجمة الحرفية لتوليد الصور، ويتحمّل العامية.
     */
    public String toScenePrompt(String arabic) {
        if (arabic == null || arabic.isBlank()) return arabic;
        if (useLlm && togetherKey != null && !togetherKey.isBlank()) {
            String llm = llmScenePrompt(arabic);
            if (llm != null && !llm.isBlank()) return llm;
        }
        return toEnglish(arabic); // بديل: MyMemory
    }

    private String llmScenePrompt(String arabic) {
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", llmModel);
            body.put("max_tokens", 130);
            body.put("temperature", 0.4);
            var msgs = body.putArray("messages");
            ObjectNode sys = msgs.addObject();
            sys.put("role", "system");
            sys.put("content", "You convert one Arabic story sentence (Modern Standard or any dialect) into a single "
                + "vivid English image-generation prompt describing only what is visible: the main subject, the exact "
                + "action, the setting, and the mood/light. One concrete sentence, no names, no preamble, no quotes.");
            ObjectNode usr = msgs.addObject();
            usr.put("role", "user");
            usr.put("content", arabic);

            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.together.xyz/v1/chat/completions"))
                .timeout(Duration.ofSeconds(30))
                .header("Authorization", "Bearer " + togetherKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body.toString(), StandardCharsets.UTF_8))
                .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (res.statusCode() == 200) {
                String out = mapper.readTree(res.body()).path("choices").path(0)
                    .path("message").path("content").asText("").trim();
                if (out.startsWith("\"") && out.endsWith("\"") && out.length() > 1) out = out.substring(1, out.length() - 1);
                return out;
            }
        } catch (Exception ignored) { }
        return null;
    }

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
