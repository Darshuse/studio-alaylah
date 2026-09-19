package com.familytales.auth;

import com.familytales.auth.AuthDtos.*;
import com.familytales.config.JwtService;
import com.familytales.family.FamilyEntity;
import com.familytales.family.FamilyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository users;
    private final FamilyRepository families;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, FamilyRepository families, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.families = families;
        this.encoder = encoder;
        this.jwt = jwt;
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
