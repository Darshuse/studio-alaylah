package com.familytales.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/** إصدار وتحقّق رموز JWT. الموضوع (subject) = معرّف المستخدم. */
@Service
public class JwtService {

    // السر الافتراضي للتطوير فقط — يُرفض في الإنتاج (allow-dev-secret=false)
    private static final String DEV_DEFAULT = "dev-only-change-me-in-production-0123456789abcdef";

    private final SecretKey key;
    private final long ttlMinutes;

    public JwtService(@Value("${security.jwt.secret}") String secret,
                      @Value("${security.jwt.ttl-minutes}") long ttlMinutes,
                      @Value("${security.jwt.allow-dev-secret:true}") boolean allowDevSecret) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32)
            throw new IllegalStateException("JWT secret ضعيف/مفقود — لازم ≥ 32 بايت. اضبط JWT_SECRET.");
        if (!allowDevSecret && DEV_DEFAULT.equals(secret))
            throw new IllegalStateException("ممنوع تشغيل الإنتاج بالسر الافتراضي — اضبط JWT_SECRET قويًّا "
                + "ثم security.jwt.allow-dev-secret=false.");
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlMinutes = ttlMinutes;
    }

    public String issue(String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(userId)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(ttlMinutes * 60)))
            .signWith(key)
            .compact();
    }

    /** يعيد معرّف المستخدم أو null إذا كان الرمز غير صالح. */
    public String parseUserId(String token) {
        try {
            return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload().getSubject();
        } catch (Exception e) {
            return null;
        }
    }
}
