package com.familytales.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record RegisterRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, message = "كلمة المرور ٨ أحرف على الأقل") String password,
        String displayName
    ) {}

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

    public record AuthResponse(String token, String userId, String displayName, String familyId) {}
}
