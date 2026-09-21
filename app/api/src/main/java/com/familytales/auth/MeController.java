package com.familytales.auth;

import com.familytales.family.FamilyEntity;
import com.familytales.family.FamilyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/** بيانات المستخدم الحالي (لعرض الاسم ديناميكيًا والتحقق من الجلسة). */
@RestController
@RequestMapping("/api/v1")
public class MeController {

    private final UserRepository users;
    private final FamilyRepository families;

    public MeController(UserRepository users, FamilyRepository families) {
        this.users = users;
        this.families = families;
    }

    public record MeView(String userId, String email, String displayName, String familyId,
                         String plan, int storyCredits) {}

    @GetMapping("/me")
    public MeView me(Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        UserEntity u = users.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "المستخدم غير موجود"));
        FamilyEntity f = families.findFirstByOwnerId(userId).orElse(null);
        return new MeView(u.getId().toString(), u.getEmail(), u.getDisplayName(),
            f != null ? f.getId().toString() : null,
            f != null ? f.getPlan() : "free",
            f != null ? f.getStoryCredits() : 0);
    }
}
