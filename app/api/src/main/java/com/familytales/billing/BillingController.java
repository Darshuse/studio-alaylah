package com.familytales.billing;

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
    private final boolean testGrantEnabled;

    public BillingController(FamilyRepository families,
                             @Value("${billing.test-grant:false}") boolean testGrantEnabled) {
        this.families = families;
        this.testGrantEnabled = testGrantEnabled;
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
}
