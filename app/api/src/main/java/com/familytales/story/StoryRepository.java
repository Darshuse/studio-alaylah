package com.familytales.story;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface StoryRepository extends JpaRepository<StoryEntity, UUID> {
    List<StoryEntity> findByFamilyIdOrderByCreatedAtDesc(UUID familyId);
}
