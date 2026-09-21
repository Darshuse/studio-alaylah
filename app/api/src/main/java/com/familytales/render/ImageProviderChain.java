package com.familytales.render;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * سلسلة مزوّدي الصور (مرونة): يجرّب المزوّدين بالترتيب، وعند فشل مزوّد ينتقل للتالي (نِدّ).
 * Circuit breaker خفيف: مزوّد يفشل متتاليًا يُتخطّى لفترة تهدئة (يمنع مهاجمة مزوّد ساقط).
 * تنبيه نفاد الرصيد: يسجّل ERROR واضحًا عند خطأ credit/402.
 *
 * جاهز للمزوّد التاني: أضِف أي bean ImageProvider جديد فيدخل السلسلة تلقائيًا.
 * حاليًا (مزوّد واحد) = التفافة آمنة بـretry/breaker/alert.
 */
@Service
public class ImageProviderChain {

    private static final Logger log = LoggerFactory.getLogger(ImageProviderChain.class);
    private static final int TRIP_AFTER = 3;         // فشلات متتالية تفتح القاطع
    private static final long COOLDOWN_MS = 60_000;   // مدة تخطّي المزوّد الساقط

    private final List<ImageProvider> providers;
    private final ConcurrentHashMap<String, Breaker> breakers = new ConcurrentHashMap<>();

    public ImageProviderChain(List<ImageProvider> providers) {
        this.providers = providers;
        log.info("ImageProviderChain: {} مزوّد ← {}", providers.size(),
            providers.stream().map(ImageProvider::name).toList());
    }

    private static final class Breaker {
        final AtomicInteger fails = new AtomicInteger();
        volatile long openUntil = 0;
        boolean open() { return System.currentTimeMillis() < openUntil; }
        void ok() { fails.set(0); openUntil = 0; }
        void fail() { if (fails.incrementAndGet() >= TRIP_AFTER) openUntil = System.currentTimeMillis() + COOLDOWN_MS; }
    }

    public boolean supportsReferences() {
        return providers.stream().anyMatch(ImageProvider::supportsReferences);
    }

    /** توليد مشهد عبر السلسلة (مع حقن مراجع إن وُجدت). */
    public byte[] generateScene(String prompt, String seed, List<byte[]> refs) throws Exception {
        return run("generateScene", refs != null && !refs.isEmpty(),
            p -> p.generateScene(prompt, seed, refs));
    }

    /** تحويل صورة → أفاتار عبر السلسلة. */
    public byte[] editToAvatar(String prompt, byte[] photo, String contentType) throws Exception {
        return run("editToAvatar", true, p -> p.editToAvatar(prompt, photo, contentType));
    }

    private interface Call { byte[] apply(ImageProvider p) throws Exception; }

    private byte[] run(String op, boolean needsRefs, Call call) throws Exception {
        List<ImageProvider> ordered = new ArrayList<>(providers);
        // فضّل مزوّدًا يدعم المراجع عند الحاجة
        if (needsRefs) ordered.sort((a, b) -> Boolean.compare(b.supportsReferences(), a.supportsReferences()));

        Exception last = null;
        boolean anyTried = false;
        for (ImageProvider p : ordered) {
            Breaker br = breakers.computeIfAbsent(p.name(), k -> new Breaker());
            if (br.open()) { log.warn("تخطّي {} ({}): القاطع مفتوح", p.name(), op); continue; }
            anyTried = true;
            try {
                byte[] out = call.apply(p);
                br.ok();
                return out;
            } catch (UnsupportedOperationException uoe) {
                // المزوّد لا يدعم العملية → جرّب التالي بلا احتساب فشل
            } catch (Exception e) {
                last = e;
                br.fail();
                alertIfCredit(p, e);
                log.warn("فشل {} على {}: {} — المحاولة على التالي", op, p.name(), brief(e));
            }
        }
        if (!anyTried) throw new IllegalStateException("لا مزوّد صور متاح (كل القواطع مفتوحة أو لا يدعم العملية)");
        throw (last != null) ? last : new IllegalStateException("فشل كل مزوّدي الصور في " + op);
    }

    private void alertIfCredit(ImageProvider p, Exception e) {
        String m = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
        if (m.contains("credit") || m.contains("402") || m.contains("top_up") || m.contains("balance")) {
            log.error("🚨 تنبيه: رصيد/كوتة المزوّد [{}] قد نفد — أضِف رصيدًا أو فعّل مزوّدًا بديلًا. ({})",
                p.name(), brief(e));
        }
    }

    private static String brief(Exception e) {
        String s = e.getMessage() == null ? e.toString() : e.getMessage();
        return s.length() > 160 ? s.substring(0, 160) : s;
    }
}
