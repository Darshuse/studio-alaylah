package com.familytales.auth;

import com.familytales.auth.AuthDtos.*;
import com.familytales.config.JwtService;
import com.familytales.family.FamilyEntity;
import com.familytales.family.FamilyRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository users;
    private final FamilyRepository families;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final GoogleIdTokenVerifier googleVerifier; // null لو لم يُضبط GOOGLE_CLIENT_ID

    public AuthService(UserRepository users, FamilyRepository families, PasswordEncoder encoder, JwtService jwt,
                       @Value("${security.google.client-id:}") String googleClientId) {
        this.users = users;
        this.families = families;
        this.encoder = encoder;
        this.jwt = jwt;
        this.googleVerifier = (googleClientId == null || googleClientId.isBlank()) ? null
            : new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId)).build();
    }

    /**
     * تسجيل الدخول بجوجل: نتحقق من توقيع التوكن + الجمهور + الإصدار + الانتهاء عبر مفاتيح جوجل العامة،
     * ثم find-or-create (ربط بالإيميل الموثّق) ونُصدر JWT بتاعنا — نفس نظام الجلسة.
     */
    @Transactional
    public AuthResponse googleSignIn(GoogleAuthRequest req) {
        if (googleVerifier == null)
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "الدخول بجوجل غير مفعّل بعد.");
        GoogleIdToken token;
        try { token = googleVerifier.verify(req.idToken()); }
        catch (Exception e) { token = null; }
        if (token == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "توكن جوجل غير صالح");

        GoogleIdToken.Payload p = token.getPayload();
        if (!Boolean.TRUE.equals(p.getEmailVerified()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "بريد جوجل غير موثّق");
        String email = p.getEmail().trim().toLowerCase();
        String name = (String) p.get("name");
        String sub = p.getSubject();

        UserEntity u = users.findByEmail(email).orElse(null);
        if (u == null) {
            u = new UserEntity();
            u.setEmail(email);
            u.setDisplayName(name);
            u.setProvider("google");
            u.setProviderId(sub); // لا باسورد لحساب اجتماعي
            u = users.save(u);
            FamilyEntity f = new FamilyEntity();
            f.setOwnerId(u.getId());
            f.setName(name != null ? "عائلة " + name : "عائلتي");
            families.save(f);
        } else if (u.getProvider() == null) {
            // ربط حساب إيميل قائم بجوجل (نفس الإيميل الموثّق) — يحلّ نسيان الباسورد
            u.setProvider("google");
            u.setProviderId(sub);
            if ((u.getDisplayName() == null || u.getDisplayName().isBlank()) && name != null) u.setDisplayName(name);
            users.save(u);
        }

        UUID familyId = families.findFirstByOwnerId(u.getId()).map(FamilyEntity::getId).orElse(null);
        return new AuthResponse(jwt.issue(u.getId().toString()), u.getId().toString(), u.getDisplayName(),
            familyId != null ? familyId.toString() : null);
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "البريد مستخدم بالفعل");

        UserEntity u = new UserEntity();
        u.setEmail(req.email());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setDisplayName(req.displayName());
        u = users.save(u);

        // كل مستخدم ينشئ عائلة افتراضية (نطاق الخصوصية)
        FamilyEntity f = new FamilyEntity();
        f.setOwnerId(u.getId());
        f.setName(req.displayName() != null ? "عائلة " + req.displayName() : "عائلتي");
        f = families.save(f);

        return new AuthResponse(jwt.issue(u.getId().toString()), u.getId().toString(), u.getDisplayName(), f.getId().toString());
    }

    public AuthResponse login(LoginRequest req) {
        UserEntity u = users.findByEmail(req.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "بيانات الدخول غير صحيحة"));
        if (!encoder.matches(req.password(), u.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "بيانات الدخول غير صحيحة");

        UUID familyId = families.findFirstByOwnerId(u.getId()).map(FamilyEntity::getId).orElse(null);
        return new AuthResponse(jwt.issue(u.getId().toString()), u.getId().toString(), u.getDisplayName(),
            familyId != null ? familyId.toString() : null);
    }
}
