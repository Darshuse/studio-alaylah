package com.familytales.config;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * الأمان: مسارات عامة (ping/health/auth) مفتوحة، والباقي يتطلب JWT صالح.
 */
@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // اسمح بمسار الخطأ الداخلي حتى تصل أكواد الحالة الحقيقية (401/400/409) للعميل
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/actuator/**", "/api/v1/ping", "/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/billing/webhook").permitAll() // يناديها مزوّد الدفع (محميّة بسرّ في الهيدر)
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
