package com.familytales.billing;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/** منح الرصيد بعد دفع مؤكَّد. كل المسارات (InstaPay بموافقة يدوية، webhook) تمرّ من هنا. */
@Service
public class PaymentService {
    private final PaymentRepository payments;

    public PaymentService(PaymentRepository payments) { this.payments = payments; }

    /** يؤكّد الدفع ويمنح الرصيد مرة واحدة فقط. يرجع false لو سبق تأكيده/رفضه. */
    @Transactional
    public boolean confirm(UUID paymentId, String externalRef) {
        Optional<PaymentEntity> p = payments.findById(paymentId);
        if (p.isEmpty()) return false;
        if (externalRef != null && p.get().getExternalRef() == null) {
            p.get().setExternalRef(externalRef);
            payments.saveAndFlush(p.get());
        }
        if (payments.markPaid(paymentId) != 1) return false;
        payments.addCredits(p.get().getFamilyId(), p.get().getCredits());
        return true;
    }

    @Transactional
    public boolean reject(UUID paymentId, String note) {
        return payments.markRejected(paymentId, note) == 1;
    }
}
