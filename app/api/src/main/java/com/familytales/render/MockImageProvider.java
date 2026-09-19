package com.familytales.render;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

/**
 * مزوّد وهمي: يرسم لوحة بألوان مائية دافئة مشتقّة من البذرة (نفس البذرة → نفس اللوحة)
 * لتوضيح مفهوم ثبات الهوية دون تكلفة. يُستبدل بمزوّد حقيقي عند توفّر مفتاح.
 */
@Component
@ConditionalOnProperty(name = "image.provider", havingValue = "mock", matchIfMissing = true)
public class MockImageProvider implements ImageProvider {

    @Override
    public String name() { return "mock"; }

    @Override
    public byte[] generateScene(String prompt, String identitySeed) throws Exception {
        int w = 1024, h = 640;
        long seed = (identitySeed == null ? "seed" : identitySeed).hashCode();
        java.util.Random rnd = new java.util.Random(seed);

        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // لوحة دافئة مشتقّة من البذرة (ثابتة لنفس الشخصية)
        Color c1 = new Color(220 + rnd.nextInt(30), 150 + rnd.nextInt(60), 90 + rnd.nextInt(50));
        Color c2 = new Color(120 + rnd.nextInt(40), 60 + rnd.nextInt(40), 40 + rnd.nextInt(40));
        g.setPaint(new GradientPaint(0, 0, c1, w, h, c2));
        g.fillRect(0, 0, w, h);

        // لطخات مائية
        for (int i = 0; i < 24; i++) {
            int x = rnd.nextInt(w), y = rnd.nextInt(h), r = 40 + rnd.nextInt(160);
            g.setColor(new Color(255, 245, 230, 18 + rnd.nextInt(24)));
            g.fillOval(x - r / 2, y - r / 2, r, r);
        }

        // إطار
        g.setColor(new Color(3, 37, 33));
        g.setStroke(new BasicStroke(10));
        g.drawRect(14, 14, w - 28, h - 28);

        // نص المشهد
        g.setColor(new Color(255, 255, 255, 235));
        g.setFont(new Font("SansSerif", Font.BOLD, 30));
        String label = prompt == null ? "مشهد" : prompt;
        g.drawString(label.length() > 40 ? label.substring(0, 40) + "…" : label, 40, h - 60);
        g.setFont(new Font("SansSerif", Font.PLAIN, 18));
        g.drawString("identity-seed: " + identitySeed, 40, h - 30);

        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }
}
