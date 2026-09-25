package com.familytales.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<PaymentEntity, UUID> {
    List<PaymentEntity> findByFamilyIdOrderByCreatedAtDesc(UUID familyId);
    List<PaymentEntity> findByStatusOrderByCreatedAtAsc(String status);

    /** انتقال ذرّي pending→paid: يرجع 1 مرة واحدة فقط مهما تكرّر الطلب (idempotent). */
    @Modifying
    @Query(value = "UPDATE payments SET status='paid', decided_at=now() WHERE id=:id AND status='pending'", nativeQuery = true)
    int markPaid(@Param("id") UUID id);

    @Modifying
    @Query(value = "UPDATE payments SET status='rejected', decided_at=now(), note=:note WHERE id=:id AND status='pending'", nativeQuery = true)
    int markRejected(@Param("id") UUID id, @Param("note") String note);

    @Modifying
    @Query(value = "UPDATE families SET story_credits = story_credits + :n, plan = CASE WHEN plan='free' THEN 'payg' ELSE plan END WHERE id=:fid", nativeQuery = true)
    int addCredits(@Param("fid") UUID familyId, @Param("n") int credits);
}
