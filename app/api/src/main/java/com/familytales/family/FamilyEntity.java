package com.familytales.family;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "families")
public class FamilyEntity {
    @Id @GeneratedValue
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column
    private String name;

    // الاستحقاق: خطة + رصيد قصص (حماية التكلفة + القصة المجانية الهدية)
    @Column(name = "plan", nullable = false)
    private String plan = "free";

    @Column(name = "story_credits", nullable = false)
    private int storyCredits = 1;

    @Column(name = "stories_created", nullable = false)
    private int storiesCreated = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public int getStoryCredits() { return storyCredits; }
    public void setStoryCredits(int storyCredits) { this.storyCredits = storyCredits; }
    public int getStoriesCreated() { return storiesCreated; }
    public void setStoriesCreated(int storiesCreated) { this.storiesCreated = storiesCreated; }
}
