package com.familytales;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * استوديو حكايات العائلة — نقطة تشغيل المونوليث المعياري.
 * الوحدات: auth, story, voice, character, render, media, privacy, jobs.
 */
@SpringBootApplication
@EnableAsync
public class FamilyTalesApplication {
    public static void main(String[] args) {
        SpringApplication.run(FamilyTalesApplication.class, args);
    }
}
