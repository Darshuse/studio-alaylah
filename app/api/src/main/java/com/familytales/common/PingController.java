package com.familytales.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/** فحص حياة بسيط لإثبات أن الهيكل يعمل. */
@RestController
@RequestMapping("/api/v1")
public class PingController {

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of(
            "service", "family-tales-api",
            "status", "ok",
            "time", Instant.now().toString()
        );
    }
}
