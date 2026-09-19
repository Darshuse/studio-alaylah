package com.familytales.render;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "generation_jobs")
public class GenerationJobEntity {
    @Id @GeneratedValue
    private UUID id;

    @Column(name = "story_id", nullable = false)
    private UUID storyId;

    @Column(nullable = false)
    private String kind;             // scene_image | ...

    @Column(nullable = false)
    private String status = "queued"; // queued/processing/needs_review/completed/failed/cancelled

    @Column(nullable = false)
    private int progress = 0;

    @Column
    private String error;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public UUID getStoryId() { return storyId; }
    public void setStoryId(UUID storyId) { this.storyId = storyId; }
    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
