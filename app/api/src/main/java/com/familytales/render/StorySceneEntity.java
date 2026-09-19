package com.familytales.render;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "story_scenes")
public class StorySceneEntity {
    @Id @GeneratedValue
    private UUID id;

    @Column(name = "story_id", nullable = false)
    private UUID storyId;

    @Column(name = "scene_order", nullable = false)
    private int sceneOrder;

    @Column
    private String title;

    @Column
    private String caption;

    @Column(name = "image_key")
    private String imageKey;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public UUID getStoryId() { return storyId; }
    public void setStoryId(UUID storyId) { this.storyId = storyId; }
    public int getSceneOrder() { return sceneOrder; }
    public void setSceneOrder(int sceneOrder) { this.sceneOrder = sceneOrder; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public String getImageKey() { return imageKey; }
    public void setImageKey(String imageKey) { this.imageKey = imageKey; }
}
