package com.familytales.story;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface StoryRevisionRepository extends JpaRepository<StoryRevisionEntity, UUID> {
    Optional<StoryRevisionEntity> findFirstByStoryIdOrderByCreatedAtDesc(UUID storyId);
}
