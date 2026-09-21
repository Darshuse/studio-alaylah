package com.familytales;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * استوديو حكايات العائلة — نقطة تشغيل المونوليث المعياري.
 * التوليد الثقيل عبر طابور RabbitMQ (حزمة queue) → workers قابلة للتوسّع.
 */
@SpringBootApplication
public class FamilyTalesApplication {
    public static void main(String[] args) {
        SpringApplication.run(FamilyTalesApplication.class, args);
    }
}
