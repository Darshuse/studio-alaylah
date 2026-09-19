package com.familytales.render;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;

/**
 * مزوّد ElevenLabs: استنساخ صوت فوري (Instant Voice Cloning) + تحويل نص عربي→صوت.
 * يُفعّل بـ tts.provider=elevenlabs ويحتاج ELEVENLABS_API_KEY بصلاحية Voices + Text-to-Speech
 * وباقة مدفوعة (الاستنساخ غير متاح على المجاني).
 */
@Component
@ConditionalOnProperty(name = "tts.provider", havingValue = "elevenlabs")
public class ElevenLabsTtsProvider implements TtsProvider {

    private static final String BASE = "https://api.elevenlabs.io/v1";

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final String key;
    private final String model;

    public ElevenLabsTtsProvider(@Value("${tts.elevenlabs.key:}") String key,
                                 @Value("${tts.elevenlabs.model:eleven_multilingual_v2}") String model) {
        this.key = key;
        this.model = model;
    }

    @Override
    public String name() { return "elevenlabs:" + model; }

    private void requireKey() {
        if (key == null || key.isBlank())
            throw new IllegalStateException("ELEVENLABS_API_KEY غير مضبوط.");
    }

    @Override
    public String cloneVoice(String label, byte[] sample, String sampleContentType) throws Exception {
        requireKey();
        String boundary = "----ft" + UUID.randomUUID().toString().replace("-", "");
        String ext = sampleContentType != null && sampleContentType.contains("mp3") ? "mp3"
            : sampleContentType != null && sampleContentType.contains("wav") ? "wav" : "webm";

        ByteArrayOutputStream body = new ByteArrayOutputStream();
        writePart(body, boundary, "name", label);
        writePart(body, boundary, "description", "Family Tales cloned parent voice");
        writeFilePart(body, boundary, "files", "sample." + ext,
            sampleContentType == null ? "audio/webm" : sampleContentType, sample);
        body.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

        HttpRequest req = HttpRequest.newBuilder(URI.create(BASE + "/voices/add"))
            .timeout(Duration.ofSeconds(120))
            .header("xi-api-key", key)
            .header("Content-Type", "multipart/form-data; boundary=" + boundary)
            .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
            .build();

        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (res.statusCode() != 200)
            throw new RuntimeException("ElevenLabs clone " + res.statusCode() + ": " + snippet(res.body()));
        String voiceId = mapper.readTree(res.body()).path("voice_id").asText("");
        if (voiceId.isBlank()) throw new RuntimeException("ElevenLabs لم يُرجِع voice_id");
        return voiceId;
    }

    @Override
    public byte[] synthesize(String text, String voiceId) throws Exception {
        requireKey();
        ObjectNode b = mapper.createObjectNode();
        b.put("text", text);
        b.put("model_id", model);
        ObjectNode vs = b.putObject("voice_settings");
        vs.put("stability", 0.5);
        vs.put("similarity_boost", 0.85);
        vs.put("style", 0.0);
        vs.put("use_speaker_boost", true);

        HttpRequest req = HttpRequest.newBuilder(URI.create(BASE + "/text-to-speech/" + voiceId))
            .timeout(Duration.ofSeconds(120))
            .header("xi-api-key", key)
            .header("Content-Type", "application/json")
            .header("Accept", "audio/mpeg")
            .POST(HttpRequest.BodyPublishers.ofString(b.toString(), StandardCharsets.UTF_8))
            .build();

        HttpResponse<byte[]> res = http.send(req, HttpResponse.BodyHandlers.ofByteArray());
        if (res.statusCode() != 200) {
            String err = new String(res.body(), StandardCharsets.UTF_8);
            throw new RuntimeException("ElevenLabs tts " + res.statusCode() + ": " + snippet(err));
        }
        return res.body();
    }

    @Override
    public void deleteVoice(String voiceId) {
        if (voiceId == null || voiceId.isBlank()) return;
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(BASE + "/voices/" + voiceId))
                .timeout(Duration.ofSeconds(30))
                .header("xi-api-key", key)
                .DELETE()
                .build();
            http.send(req, HttpResponse.BodyHandlers.discarding());
        } catch (Exception ignored) {
            // تنظيف أفضل-جهد؛ فشل الحذف لا يُفشل التوليد
        }
    }

    // ===== أدوات multipart =====
    private static void writePart(ByteArrayOutputStream out, String boundary, String field, String value) throws Exception {
        out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"" + field + "\"\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(value.getBytes(StandardCharsets.UTF_8));
        out.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private static void writeFilePart(ByteArrayOutputStream out, String boundary, String field,
                                      String filename, String contentType, byte[] data) throws Exception {
        out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"" + field + "\"; filename=\"" + filename + "\"\r\n")
            .getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Type: " + contentType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(data);
        out.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private static String snippet(String s) {
        if (s == null) return "";
        return s.substring(0, Math.min(300, s.length()));
    }
}
