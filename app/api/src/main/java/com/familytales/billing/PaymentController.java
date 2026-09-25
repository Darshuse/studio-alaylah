package com.familytales.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.familytales.family.FamilyEntity;
import com.familytales.family.FamilyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * الدفع: InstaPay (مصر، يدوي بموافقة إدارية) + Lemon Squeezy (دولي، checkout مستضاف + webhook موقّع).
 * الرصيد لا يُمنح إلا عبر PaymentService.confirm (ذرّي + يمنع التكرار).
 */
@RestController
@RequestMapping("/api/v1/billing")
public class PaymentController {
    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final FamilyRepository families;
    private final PaymentRepository payments;
    private final PaymentService service;
    private final ObjectMapper json = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    private final String instapayHandle, instapayName, adminToken;
    private final String lsApiKey, lsStoreId, lsSigningSecret, appUrl;
    private final Map<String, String> lsVariants;

    public PaymentController(FamilyRepository families, PaymentRepository payments, PaymentService service,
                             @Value("${billing.instapay.handle:}") String instapayHandle,
                             @Value("${billing.instapay.name:}") String instapayName,
                             @Value("${billing.admin-token:}") String adminToken,
                             @Value("${billing.ls.api-key:}") String lsApiKey,
                             @Value("${billing.ls.store-id:}") String lsStoreId,
                             @Value("${billing.ls.signing-secret:}") String lsSigningSecret,
                             @Value("${billing.ls.variant-usd5:}") String v5,
                             @Value("${billing.ls.variant-usd15:}") String v15,
                             @Value("${billing.app-url:}") String appUrl) {
        this.families = families; this.payments = payments; this.service = service;
        this.instapayHandle = instapayHandle; this.instapayName = instapayName; this.adminToken = adminToken;
        this.lsApiKey = lsApiKey; this.lsStoreId = lsStoreId; this.lsSigningSecret = lsSigningSecret;
        this.lsVariants = Map.of("usd_5", v5, "usd_15", v15);
        this.appUrl = appUrl;
    }

    private FamilyEntity familyOf(Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        return families.findFirstByOwnerId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "لا توجد عائلة"));
    }

    // ---------- الكتالوج ----------
    public record SkuView(String id, String provider, String currency, double amount, int credits, String label) {}
    public record CatalogView(List<SkuView> items, boolean instapayReady, String instapayHandle,
                              String instapayName, boolean cardsReady) {}

    @GetMapping("/catalog")
    public CatalogView catalog() {
        var items = PaymentCatalog.ALL.stream()
            .map(s -> new SkuView(s.id(), s.provider(), s.currency(), s.amountMinor() / 100.0, s.credits(), s.label()))
            .toList();
        boolean cards = !lsApiKey.isBlank() && !lsStoreId.isBlank() && !lsSigningSecret.isBlank();
        return new CatalogView(items, !instapayHandle.isBlank(), instapayHandle, instapayName, cards);
    }

    // ---------- InstaPay اليدوي ----------
    public record ManualRequest(String sku, String reference) {}
    public record PaymentView(String id, String provider, String sku, int credits, double amount,
                              String currency, String status, String ref, String createdAt) {}

    private static PaymentView view(PaymentEntity p) {
        return new PaymentView(p.getId().toString(), p.getProvider(), p.getSku(), p.getCredits(),
            p.getAmountMinor() / 100.0, p.getCurrency(), p.getStatus(), p.getExternalRef(),
            p.getCreatedAt() == null ? null : p.getCreatedAt().toString());
    }

    @PostMapping("/manual/instapay")
    public PaymentView manualInstapay(Authentication auth, @RequestBody ManualRequest req) {
        if (instapayHandle.isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "الدفع بانستاباي غير مفعّل بعد.");
        var sku = PaymentCatalog.find(req.sku())
            .filter(s -> s.provider().equals("instapay"))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "باقة غير معروفة"));
        String ref = req.reference() == null ? "" : req.reference().trim();
        if (ref.length() < 6 || ref.length() > 40 || !ref.matches("[A-Za-z0-9\\-]+"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "اكتب رقم العملية كما يظهر في إيصال انستاباي (أرقام/حروف فقط).");
        FamilyEntity f = familyOf(auth);
        PaymentEntity p = newPayment(f, sku);
        p.setExternalRef(ref);
        try {
            payments.saveAndFlush(p);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "رقم العملية هذا مُسجَّل من قبل.");
        }
        log.warn("PAYMENT pending instapay id={} sku={} ref={} family={}", p.getId(), sku.id(), ref, f.getId());
        return view(p);
    }

    private static PaymentEntity newPayment(FamilyEntity f, PaymentCatalog.Sku sku) {
        PaymentEntity p = new PaymentEntity();
        p.setFamilyId(f.getId()); p.setProvider(sku.provider()); p.setSku(sku.id());
        p.setCredits(sku.credits()); p.setAmountMinor(sku.amountMinor()); p.setCurrency(sku.currency());
        return p;
    }

    @GetMapping("/payments")
    public List<PaymentView> myPayments(Authentication auth) {
        return payments.findByFamilyIdOrderByCreatedAtDesc(familyOf(auth).getId()).stream().map(PaymentController::view).toList();
    }

    // ---------- إدارة الموافقة (سرّ إداري في الهيدر) ----------
    private void requireAdmin(String token) {
        if (adminToken.isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "الإدارة غير مضبوطة");
        if (token == null || !MessageDigest.isEqual(adminToken.getBytes(StandardCharsets.UTF_8), token.getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "غير مصرّح");
    }

    @GetMapping("/admin/pending")
    public List<PaymentView> adminPending(@RequestHeader(value = "X-Admin-Token", required = false) String t) {
        requireAdmin(t);
        return payments.findByStatusOrderByCreatedAtAsc("pending").stream()
            .filter(p -> p.getProvider().equals("instapay")).map(PaymentController::view).toList();
    }

    @PostMapping("/admin/{id}/approve")
    public Map<String, Object> adminApprove(@RequestHeader(value = "X-Admin-Token", required = false) String t, @PathVariable UUID id) {
        requireAdmin(t);
        boolean done = service.confirm(id, null);
        log.warn("PAYMENT approve id={} applied={}", id, done);
        return Map.of("applied", done);
    }

    @PostMapping("/admin/{id}/reject")
    public Map<String, Object> adminReject(@RequestHeader(value = "X-Admin-Token", required = false) String t, @PathVariable UUID id) {
        requireAdmin(t);
        return Map.of("applied", service.reject(id, "لم يُطابق الإيصال"));
    }

    // ---------- Lemon Squeezy ----------
    public record CheckoutRequest(String sku) {}

    @PostMapping("/checkout")
    public Map<String, String> checkout(Authentication auth, @RequestBody CheckoutRequest req) {
        var sku = PaymentCatalog.find(req.sku())
            .filter(s -> s.provider().equals("lemonsqueezy"))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "باقة غير معروفة"));
        String variant = lsVariants.getOrDefault(sku.id(), "");
        if (lsApiKey.isBlank() || lsStoreId.isBlank() || lsSigningSecret.isBlank() || variant.isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "الدفع بالبطاقة يُفعَّل قريبًا.");
        FamilyEntity f = familyOf(auth);
        PaymentEntity p = newPayment(f, sku);
        payments.saveAndFlush(p);
        try {
            var attrs = json.createObjectNode();
            attrs.putObject("checkout_data").putObject("custom").put("payment_id", p.getId().toString());
            if (!appUrl.isBlank()) attrs.putObject("product_options").put("redirect_url", appUrl + "/pay?done=1");
            var body = json.createObjectNode();
            var data = body.putObject("data");
            data.put("type", "checkouts");
            data.set("attributes", attrs);
            var rel = data.putObject("relationships");
            rel.putObject("store").putObject("data").put("type", "stores").put("id", lsStoreId);
            rel.putObject("variant").putObject("data").put("type", "variants").put("id", variant);
            HttpRequest r = HttpRequest.newBuilder(URI.create("https://api.lemonsqueezy.com/v1/checkouts"))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + lsApiKey)
                .header("Accept", "application/vnd.api+json")
                .header("Content-Type", "application/vnd.api+json")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build();
            HttpResponse<String> resp = http.send(r, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() / 100 != 2) {
                log.error("LemonSqueezy checkout failed {} {}", resp.statusCode(), resp.body());
                throw new IllegalStateException("ls " + resp.statusCode());
            }
            String url = json.readTree(resp.body()).path("data").path("attributes").path("url").asText("");
            if (url.isBlank()) throw new IllegalStateException("no url");
            return Map.of("url", url);
        } catch (Exception e) {
            payments.markRejected(p.getId(), "checkout failed");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "تعذّر فتح صفحة الدفع، حاول بعد قليل.");
        }
    }

    /** webhook موقّع: X-Signature = HMAC-SHA256(rawBody, signing-secret) بصيغة hex. */
    @PostMapping("/webhook/lemonsqueezy")
    public Map<String, Object> lsWebhook(@RequestHeader(value = "X-Signature", required = false) String sig,
                                         @RequestBody String raw) {
        if (lsSigningSecret.isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "webhook غير مضبوط");
        if (sig == null || !validSignature(raw, sig))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "توقيع غير صحيح");
        try {
            JsonNode root = json.readTree(raw);
            String event = root.path("meta").path("event_name").asText("");
            String pid = root.path("meta").path("custom_data").path("payment_id").asText("");
            String status = root.path("data").path("attributes").path("status").asText("");
            String orderId = root.path("data").path("id").asText("");
            if (!event.equals("order_created") || !status.equals("paid") || pid.isBlank())
                return Map.of("ignored", true);
            boolean done = service.confirm(UUID.fromString(pid), "ls-" + orderId);
            log.warn("PAYMENT webhook ls order={} payment={} applied={}", orderId, pid, done);
            return Map.of("applied", done);
        } catch (DataIntegrityViolationException e) {
            return Map.of("applied", false); // نفس الطلب وصل مرتين
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "payload غير صالح");
        }
    }

    private boolean validSignature(String raw, String sig) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(lsSigningSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = HexFormat.of().formatHex(mac.doFinal(raw.getBytes(StandardCharsets.UTF_8))).getBytes(StandardCharsets.UTF_8);
            return MessageDigest.isEqual(expected, sig.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return false;
        }
    }
}
