package com.familytales.media;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface MediaAssetRepository extends JpaRepository<MediaAssetEntity, UUID> {
    Optional<MediaAssetEntity> findFirstByStoryIdAndKindOrderByCreatedAtDesc(UUID storyId, String kind);
    // أحدث تسجيل صوتي في العائلة (من أي قصة) — للاستنساخ التلقائي من الأرشيف
    Optional<MediaAssetEntity> findFirstByFamilyIdAndKindOrderByCreatedAtDesc(UUID familyId, String kind);
}
