package com.familytales.story;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "story_revisions")
public class StoryRevisionEntity {
    @Id @GeneratedValue
    private UUID id;

    @Column(name = "story_id", nullable = false)
    private UUID storyId;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(name = "is_approved", nullable = false)
    private boolean approved = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public UUID getStoryId() { return storyId; }
    public void setStoryId(UUID storyId) { this.storyId = storyId; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
