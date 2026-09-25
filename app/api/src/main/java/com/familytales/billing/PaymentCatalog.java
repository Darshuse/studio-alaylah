package com.familytales.billing;

import java.util.List;
import java.util.Optional;

/**
 * باقات الرصيد. الأسعار من docs/PRICING.md (مصر بالجنيه عبر InstaPay، الباقي بالدولار عبر Lemon Squeezy).
 * الدولار: لا نبيع قصة واحدة بـ$1.99 لأن رسوم المزوّد (~5%+50c) تأكل ~30% — نبيع باقات.
 */
public final class PaymentCatalog {
    public record Sku(String id, String provider, String currency, long amountMinor, int credits, String label) {}

    public static final List<Sku> ALL = List.of(
        new Sku("egp_1",  "instapay",      "EGP", 10_000, 1,  "الذكرى — قصة واحدة"),
        new Sku("egp_5",  "instapay",      "EGP", 29_900, 5,  "باقة ٥ قصص"),
        new Sku("usd_5",  "lemonsqueezy",  "USD",    799, 5,  "باقة ٥ قصص"),
        new Sku("usd_15", "lemonsqueezy",  "USD",  1_999, 15, "باقة ١٥ قصة")
    );

    public static Optional<Sku> find(String id) {
        return ALL.stream().filter(s -> s.id().equals(id)).findFirst();
    }

    private PaymentCatalog() {}
}
