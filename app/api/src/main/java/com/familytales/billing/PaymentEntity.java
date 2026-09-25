package com.familytales.billing;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class PaymentEntity {
    @Id
    private UUID id = UUID.randomUUID();
    @Column(name = "family_id", nullable = false) private UUID familyId;
    @Column(nullable = false) private String provider;
    @Column(nullable = false) private String sku;
    @Column(nullable = false) private int credits;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(nullable = false) private String currency;
    @Column(nullable = false) private String status = "pending";
    @Column(name = "external_ref") private String externalRef;
    @Column private String note;
    @Column(name = "created_at", insertable = false, updatable = false) private OffsetDateTime createdAt;
    @Column(name = "decided_at", insertable = false, updatable = false) private OffsetDateTime decidedAt;

    public UUID getId() { return id; }
    public UUID getFamilyId() { return familyId; }
    public void setFamilyId(UUID v) { this.familyId = v; }
    public String getProvider() { return provider; }
    public void setProvider(String v) { this.provider = v; }
    public String getSku() { return sku; }
    public void setSku(String v) { this.sku = v; }
    public int getCredits() { return credits; }
    public void setCredits(int v) { this.credits = v; }
    public long getAmountMinor() { return amountMinor; }
    public void setAmountMinor(long v) { this.amountMinor = v; }
    public String getCurrency() { return currency; }
    public void setCurrency(String v) { this.currency = v; }
    public String getStatus() { return status; }
    public String getExternalRef() { return externalRef; }
    public void setExternalRef(String v) { this.externalRef = v; }
    public String getNote() { return note; }
    public void setNote(String v) { this.note = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
