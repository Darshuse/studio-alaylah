package com.familytales.billing;

import com.familytales.auth.UserEntity;
import com.familytales.auth.UserRepository;
import com.familytales.family.FamilyEntity;
import com.familytales.family.FamilyRepository;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * الفوترة والاستحقاق. حاليًا نقاط اختبار (grant/subscribe) محميّة بعلم إعداد.
 * في الإنتاج: تُستبدل نقطة المنح بـ webhook من مزوّد الدفع (MoR: Lemon Squeezy/Paddle، أو محلي).
 */
@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final FamilyRepository families;
    private final UserRepository users;
    private final boolean testGrantEnabled;
    private final String webhookSecret;

    public BillingController(FamilyRepository families, UserRepository users,
                             @Value("${billing.test-grant:false}") boolean testGrantEnabled,
                             @Value("${billing.webhook-secret:}") String webhookSecret) {
        this.families = families;
        this.users = users;
        this.testGrantEnabled = testGrantEnabled;
        this.webhookSecret = webhookSecret;
    }

    public record GrantRequest(@Min(1) int credits) {}
    public record EntitlementView(String plan, int storyCredits) {}

    private FamilyEntity familyOf(Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        return families.findFirstByOwnerId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "لا توجد عائلة"));
    }

    /** يعرض الخطة والرصيد الحالي. */
    @GetMapping("/entitlement")
    public EntitlementView entitlement(Authentication auth) {
        FamilyEntity f = familyOf(auth);
        return new EntitlementView(f.getPlan(), f.getStoryCredits());
    }

    /** شحن رصيد قصص (اختبار — يمثّل شراء ناجح). في الإنتاج: webhook الدفع. */
    @PostMapping("/redeem")
    public EntitlementView redeem(Authentication auth, @RequestBody GrantRequest req) {
        if (!testGrantEnabled)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "الدفع غير مفعّل — قيد الربط بمزوّد الدفع.");
        FamilyEntity f = familyOf(auth);
        f.setStoryCredits(f.getStoryCredits() + req.credits());
        f.setPlan("payg");
        families.save(f);
        return new EntitlementView(f.getPlan(), f.getStoryCredits());
    }

    /** تفعيل اشتراك (اختبار). في الإنتاج: webhook اشتراك. */
    @PostMapping("/subscribe")
    public EntitlementView subscribe(Authentication auth) {
        if (!testGrantEnabled)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "الدفع غير مفعّل — قيد الربط بمزوّد الدفع.");
        FamilyEntity f = familyOf(auth);
        f.setPlan("subscription");
        families.save(f);
        return new EntitlementView(f.getPlan(), f.getStoryCredits());
    }

    public record WebhookPayload(String email, Integer credits, String plan) {}

    /**
     * نقطة webhook لمزوّد الدفع (Lemon Squeezy/Paddle/محلي). عامة، محميّة بسرّ مشترك في الهيدر.
     * عند شراء ناجح: المزوّد يناديها بـ{email, credits?, plan?} فنمنح الرصيد/الاشتراك.
     * الربط الحقيقي (التحقق من توقيع المزوّد + خريطة المنتجات) يُكمَّل عند إنشاء حساب الدفع.
     */
    @PostMapping("/webhook")
    public EntitlementView webhook(@RequestHeader(value = "X-Webhook-Secret", required = false) String secret,
                                   @RequestBody WebhookPayload p) {
        if (webhookSecret == null || webhookSecret.isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "webhook غير مضبوط");
        if (!webhookSecret.equals(secret))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "توقيع webhook غير صحيح");
        if (p == null || p.email() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email مطلوب");
        UserEntity u = users.findByEmail(p.email().trim().toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "المستخدم غير موجود"));
        FamilyEntity f = families.findFirstByOwnerId(u.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "لا توجد عائلة"));
        if (p.credits() != null && p.credits() > 0) {
            f.setStoryCredits(f.getStoryCredits() + p.credits());
            if ("free".equals(f.getPlan())) f.setPlan("payg");
        }
        if (p.plan() != null && !p.plan().isBlank()) f.setPlan(p.plan().trim());
        families.save(f);
        return new EntitlementView(f.getPlan(), f.getStoryCredits());
    }
}
