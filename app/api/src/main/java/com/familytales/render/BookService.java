package com.familytales.render;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.font.FontRenderContext;
import java.awt.font.LineBreakMeasurer;
import java.awt.font.TextAttribute;
import java.awt.font.TextLayout;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.text.AttributedCharacterIterator;
import java.text.AttributedString;
import java.util.List;

/**
 * يبني كتابًا مصوّرًا (PDF) من مشاهد الحكاية: غلاف + صفحة لكل مشهد (صورة + نص عربي) + خاتمة.
 * كل صفحة تُرسم كصورة (Java2D يشكّل العربي RTL) ثم تُدمج في PDF — يتجنّب تعقيد العربي داخل PDF.
 */
@Service
public class BookService {

    private static final int W = 1080, H = 1440; // صفحة كتاب بورتريه
    private static final Color CREAM = new Color(0xFB, 0xF9, 0xF5);
    private static final Color PETROL = new Color(0x03, 0x25, 0x21);
    private static final Color TERRA = new Color(0x93, 0x4B, 0x01);
    private static final Color SLATE = new Color(0x1F, 0x24, 0x21);

    private String arFont() {
        String[] prefs = {"Tahoma", "Segoe UI", "Arial", "SansSerif"};
        String[] avail = GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames();
        for (String p : prefs) for (String a : avail) if (a.equalsIgnoreCase(p)) return a;
        return "SansSerif";
    }

    public byte[] assemble(String title, String subtitle, List<byte[]> scenePngs, List<String> captions)
            throws Exception {
        String font = arFont();
        try (PDDocument doc = new PDDocument()) {
            // الغلاف
            addPage(doc, coverPage(font, title, subtitle, scenePngs.isEmpty() ? null : scenePngs.get(0)));
            // صفحات المشاهد
            for (int i = 0; i < scenePngs.size(); i++) {
                String cap = i < captions.size() ? captions.get(i) : "";
                addPage(doc, scenePage(font, i + 1, scenePngs.get(i), cap));
            }
            // الخاتمة
            addPage(doc, endPage(font));

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private void addPage(PDDocument doc, BufferedImage img) throws Exception {
        PDPage page = new PDPage(new PDRectangle(W, H));
        doc.addPage(page);
        PDImageXObject xo = LosslessFactory.createFromImage(doc, img);
        try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
            cs.drawImage(xo, 0, 0, W, H);
        }
    }

    private Graphics2D newCanvas(BufferedImage img) {
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setColor(CREAM);
        g.fillRect(0, 0, W, H);
        return g;
    }

    private BufferedImage coverPage(String font, String title, String subtitle, byte[] hero) throws Exception {
        BufferedImage img = new BufferedImage(W, H, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = newCanvas(img);
        g.setColor(PETROL);
        g.fillRect(0, 0, W, 24);
        g.fillRect(0, H - 24, W, 24);
        if (hero != null) {
            BufferedImage h = ImageIO.read(new ByteArrayInputStream(hero));
            if (h != null) drawImageFit(g, h, 90, 360, W - 180, 620, 28);
        }
        g.setColor(PETROL);
        drawArabicCentered(g, title, new Font(font, Font.BOLD, 72), 120, W / 2, W - 160);
        if (subtitle != null && !subtitle.isBlank()) {
            g.setColor(TERRA);
            drawArabicCentered(g, subtitle, new Font(font, Font.PLAIN, 34), 250, W / 2, W - 200);
        }
        g.setColor(new Color(0x41, 0x48, 0x46));
        drawArabicCentered(g, "استوديو حكايات العائلة", new Font(font, Font.PLAIN, 28), H - 90, W / 2, W - 200);
        g.dispose();
        return img;
    }

    private BufferedImage scenePage(String font, int num, byte[] scene, String caption) throws Exception {
        BufferedImage img = new BufferedImage(W, H, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = newCanvas(img);
        BufferedImage s = ImageIO.read(new ByteArrayInputStream(scene));
        if (s != null) drawImageFit(g, s, 80, 90, W - 160, 760, 28);
        // شارة رقم المشهد
        g.setColor(TERRA);
        g.fillRoundRect(80, 110, 150, 56, 28, 28);
        g.setColor(Color.WHITE);
        drawArabicCentered(g, "مشهد " + num, new Font(font, Font.BOLD, 30), 148, 155, 150);
        // النص
        g.setColor(SLATE);
        drawArabicWrapped(g, caption, new Font(font, Font.PLAIN, 42), 130, 960, W - 260, 260);
        // رقم الصفحة
        g.setColor(new Color(0x71, 0x79, 0x76));
        drawArabicCentered(g, "• " + num + " •", new Font(font, Font.PLAIN, 24), H - 70, W / 2, 200);
        g.dispose();
        return img;
    }

    private BufferedImage endPage(String font) {
        BufferedImage img = new BufferedImage(W, H, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = newCanvas(img);
        g.setColor(PETROL);
        drawArabicCentered(g, "تمّت الحكاية 🌙", new Font(font, Font.BOLD, 64), H / 2 - 40, W / 2, W - 160);
        g.setColor(TERRA);
        drawArabicCentered(g, "وتوتة توتة", new Font(font, Font.PLAIN, 36), H / 2 + 60, W / 2, W - 200);
        g.dispose();
        return img;
    }

    // ---- أدوات الرسم ----

    private void drawImageFit(Graphics2D g, BufferedImage src, int x, int y, int w, int h, int radius) {
        double sc = Math.min((double) w / src.getWidth(), (double) h / src.getHeight());
        int dw = (int) (src.getWidth() * sc), dh = (int) (src.getHeight() * sc);
        int dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
        Shape old = g.getClip();
        g.setClip(new java.awt.geom.RoundRectangle2D.Float(dx, dy, dw, dh, radius, radius));
        g.drawImage(src, dx, dy, dw, dh, null);
        g.setClip(old);
        g.setColor(new Color(0, 0, 0, 20));
        g.setStroke(new BasicStroke(2));
        g.drawRoundRect(dx, dy, dw, dh, radius, radius);
    }

    private AttributedCharacterIterator rtl(String text, Font font) {
        AttributedString as = new AttributedString(text.isEmpty() ? " " : text);
        as.addAttribute(TextAttribute.FONT, font);
        as.addAttribute(TextAttribute.RUN_DIRECTION, TextAttribute.RUN_DIRECTION_RTL);
        return as.getIterator();
    }

    private void drawArabicCentered(Graphics2D g, String text, Font font, int baselineY, int centerX, int maxWidth) {
        FontRenderContext frc = g.getFontRenderContext();
        TextLayout tl = new TextLayout(rtl(text, font), frc);
        float tw = tl.getAdvance();
        tl.draw(g, centerX - tw / 2f, baselineY);
    }

    private void drawArabicWrapped(Graphics2D g, String text, Font font, int color, int topY, int maxWidth, int maxHeight) {
        if (text == null || text.isBlank()) return;
        FontRenderContext frc = g.getFontRenderContext();
        LineBreakMeasurer lbm = new LineBreakMeasurer(rtl(text, font), frc);
        float y = topY;
        int rightX = (W + maxWidth) / 2; // منطقة نص موسّطة أفقيًا، محاذاة يمين
        while (lbm.getPosition() < text.length() && (y - topY) < maxHeight) {
            TextLayout tl = lbm.nextLayout(maxWidth);
            y += tl.getAscent();
            float x = rightX - tl.getAdvance(); // محاذاة لليمين (RTL)
            tl.draw(g, x, y);
            y += tl.getDescent() + tl.getLeading() + 8;
        }
    }
}
