package com.familytales.story;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "stories")
public class StoryEntity {
    @Id @GeneratedValue
    private UUID id;

    @Column(name = "family_id", nullable = false)
    private UUID familyId;

    @Column
    private String title;

    @Column(nullable = false)
    private String status = "draft";

    @Column(name = "source_kind", nullable = false)
    private String sourceKind = "voice";

    @Column(name = "text_approved", nullable = false)
    private boolean textApproved = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public UUID getFamilyId() { return familyId; }
    public void setFamilyId(UUID familyId) { this.familyId = familyId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSourceKind() { return sourceKind; }
    public void setSourceKind(String sourceKind) { this.sourceKind = sourceKind; }
    public boolean isTextApproved() { return textApproved; }
    public void setTextApproved(boolean textApproved) { this.textApproved = textApproved; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
