package com.familytales.render;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * تركيب فيلم MP4 حقيقي عبر FFmpeg: صور المشاهد بحركة تقريب هادئة (Ken Burns)
 * + تسجيل الأب الصوتي كسرد. مخرج قابل للتشغيل في المتصفح (H.264/AAC).
 */
@Service
public class VideoService {

    // مخرج Full-HD بحركة سينمائية (الطبقة المجانية عالية الجودة)
    private static final int OUT_W = 1920, OUT_H = 1080, FPS = 30;
    // دقة وسيطة أعلى تمنح حركة Ken Burns «رأسًا» لتبقى حادّة أثناء التقريب
    private static final int SRC_W = 2560, SRC_H = 1440;
    private static final double ZOOM_MAX = 1.15, ZOOM_STEP = 0.0009; // ~6s للوصول للحد ثم ثبات
    private static final double FADE = 0.4; // ثوانٍ لظهور ناعم في بداية كل مشهد

    private final String ffmpeg;
    private final int secPerScene;
    private final String watermarkFont;

    public VideoService(@Value("${video.ffmpeg:ffmpeg}") String ffmpeg,
                        @Value("${video.seconds-per-scene:4}") int secPerScene,
                        @Value("${video.watermark-font:C:/Windows/Fonts/arialbd.ttf}") String watermarkFont) {
        this.ffmpeg = ffmpeg;
        this.secPerScene = secPerScene;
        this.watermarkFont = watermarkFont;
    }

    /** لاحقة فلتر العلامة المائية للمخرجات المجانية (خط لاتيني موثوق، بلا مشاكل تشكيل عربي). */
    private String watermarkSuffix(boolean on) {
        if (!on) return "";
        String font = watermarkFont.replace("\\", "/").replace(":", "\\:");
        return ",drawtext=fontfile='" + font + "':text='Family Tales Studio  -  FREE':"
            + "fontcolor=white@0.6:fontsize=40:x=w-tw-36:y=h-th-32:"
            + "shadowcolor=black@0.7:shadowx=2:shadowy=2";
    }

    /**
     * فلتر مشهد واحد: تعبئة 1080p + حركة Ken Burns (تقريب/تبعيد متبادل) + ظهور ناعم + علامة مائية.
     * يُطبَّق على صورة واحدة مكرّرة (-loop 1)؛ المدّة يحدّدها الصوت (-shortest) أو -t.
     */
    private String kenBurnsFilter(int sceneIndex, boolean watermark) {
        boolean zoomIn = (sceneIndex % 2 == 0);
        String z = zoomIn
            ? "min(1.0+" + ZOOM_STEP + "*on," + ZOOM_MAX + ")"
            : "max(" + ZOOM_MAX + "-" + ZOOM_STEP + "*on,1.0)";
        return "scale=" + SRC_W + ":" + SRC_H + ":force_original_aspect_ratio=increase,"
            + "crop=" + SRC_W + ":" + SRC_H + ","
            + "zoompan=z='" + z + "':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            + "d=1:s=" + OUT_W + "x" + OUT_H + ":fps=" + FPS + ","
            + "fade=t=in:st=0:d=" + FADE + ",setsar=1,format=yuv420p" + watermarkSuffix(watermark);
    }

    /** فلتر ثابت 1080p (مسار احتياطي بصوت واحد؛ بلا حركة Ken Burns). */
    private String staticFilter(boolean watermark) {
        return "scale=" + OUT_W + ":" + OUT_H + ":force_original_aspect_ratio=decrease,"
            + "pad=" + OUT_W + ":" + OUT_H + ":(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p" + watermarkSuffix(watermark);
    }

    /**
     * @param scenePngs بايتات صور المشاهد بالترتيب
     * @param audio     بايتات الصوت (قد تكون null إن لم يُسجَّل)
     * @return بايتات ملف MP4
     */
    public byte[] assemble(List<byte[]> scenePngs, byte[] audio, boolean watermark) throws IOException, InterruptedException {
        if (scenePngs.isEmpty()) throw new IllegalStateException("لا توجد مشاهد لتركيب الفيلم");
        Path work = Files.createTempDirectory("ft-film-");
        try {
            // اكتب صور المشاهد + قائمة concat بمدد ثابتة (تمريرة ترميز واحدة سريعة)
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < scenePngs.size(); i++) {
                Path png = work.resolve("scene" + i + ".png");
                Files.write(png, scenePngs.get(i));
                sb.append("file '").append(png.getFileName()).append("'\n");
                sb.append("duration ").append(secPerScene).append("\n");
            }
            // كرّر آخر صورة (متطلّب concat demuxer لعرض آخر مشهد كامل المدة)
            sb.append("file '").append(work.resolve("scene" + (scenePngs.size() - 1) + ".png").getFileName()).append("'\n");
            Path list = work.resolve("list.txt");
            Files.writeString(list, sb.toString(), StandardCharsets.UTF_8);

            String vf = staticFilter(watermark);
            Path out = work.resolve("film.mp4");

            List<String> cmd = new ArrayList<>(List.of(
                ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", list.getFileName().toString()));
            if (audio != null && audio.length > 0) {
                Path aud = work.resolve("narration");
                Files.write(aud, audio);
                cmd.addAll(List.of("-i", aud.getFileName().toString()));
            }
            cmd.addAll(List.of("-vf", vf, "-r", String.valueOf(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                "-pix_fmt", "yuv420p", "-fps_mode", "cfr"));
            if (audio != null && audio.length > 0) {
                cmd.addAll(List.of("-c:a", "aac", "-b:a", "192k", "-shortest"));
            }
            cmd.addAll(List.of("-movflags", "+faststart", out.toString()));

            run(work, cmd.toArray(new String[0]));
            return Files.readAllBytes(out);
        } finally {
            deleteTree(work);
        }
    }

    /**
     * تركيب فيلم بسرد لكل مشهد: مدّة كل مشهد = مدّة صوت سرده (تزامن تلقائي).
     * @param scenePngs بايتات صور المشاهد بالترتيب
     * @param sceneAudios بايتات صوت السرد لكل مشهد (عنصر قد يكون null → مشهد صامت بمدّة ثابتة)
     */
    public byte[] assembleWithNarration(List<byte[]> scenePngs, List<byte[]> sceneAudios, boolean watermark)
            throws IOException, InterruptedException {
        if (scenePngs.isEmpty()) throw new IllegalStateException("لا توجد مشاهد لتركيب الفيلم");
        Path work = Files.createTempDirectory("ft-film-n-");
        try {
            StringBuilder list = new StringBuilder();

            for (int i = 0; i < scenePngs.size(); i++) {
                Path png = work.resolve("scene" + i + ".png");
                Files.write(png, scenePngs.get(i));
                Path clip = work.resolve("clip" + i + ".mp4");
                byte[] audio = i < sceneAudios.size() ? sceneAudios.get(i) : null;
                String vf = kenBurnsFilter(i, watermark); // حركة متبادلة لكل مشهد

                List<String> cmd = new ArrayList<>(List.of(ffmpeg, "-y", "-loop", "1", "-framerate", String.valueOf(FPS), "-i", png.getFileName().toString()));
                if (audio != null && audio.length > 0) {
                    Path a = work.resolve("narr" + i + ".mp3");
                    Files.write(a, audio);
                    // صوت السرد يحدّد المدّة (-shortest)، مع لمسة صمت في النهاية لتنفّس المشهد
                    cmd.addAll(List.of("-i", a.getFileName().toString(),
                        "-af", "apad=pad_dur=0.6",
                        "-vf", vf, "-r", String.valueOf(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2", "-shortest",
                        clip.getFileName().toString()));
                } else {
                    // مشهد صامت بمدّة ثابتة (مسار صوت فارغ للحفاظ على توحيد الترميز عند اللزق)
                    cmd.addAll(List.of("-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
                        "-vf", vf, "-r", String.valueOf(FPS), "-t", String.valueOf(secPerScene),
                        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
                        clip.getFileName().toString()));
                }
                run(work, cmd.toArray(new String[0]));
                list.append("file '").append(clip.getFileName()).append("'\n");
            }

            Path listFile = work.resolve("list.txt");
            Files.writeString(listFile, list.toString(), StandardCharsets.UTF_8);
            Path out = work.resolve("film.mp4");
            // لزق المقاطع (ترميز موحّد → نسخ مباشر) + faststart للتشغيل الفوري في المتصفح
            run(work, ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", listFile.getFileName().toString(),
                "-c", "copy", "-movflags", "+faststart", out.toString());
            return Files.readAllBytes(out);
        } finally {
            deleteTree(work);
        }
    }

    private void run(Path cwd, String... cmd) throws IOException, InterruptedException {
        Process p = new ProcessBuilder(cmd).directory(cwd.toFile()).redirectErrorStream(true).start();
        String log = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (!p.waitFor(180, TimeUnit.SECONDS)) { p.destroyForcibly(); throw new IOException("انتهت مهلة FFmpeg"); }
        if (p.exitValue() != 0) {
            String tail = log.length() > 900 ? log.substring(log.length() - 900) : log;
            throw new IOException("FFmpeg فشل (" + p.exitValue() + "): " + tail);
        }
    }

    private void deleteTree(Path root) {
        try (var s = Files.walk(root)) {
            s.sorted((a, b) -> b.getNameCount() - a.getNameCount()).forEach(pth -> { try { Files.deleteIfExists(pth); } catch (IOException ignored) {} });
        } catch (IOException ignored) {}
    }
}
