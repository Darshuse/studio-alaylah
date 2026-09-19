package com.familytales.render;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

public interface StorySceneRepository extends JpaRepository<StorySceneEntity, UUID> {
    List<StorySceneEntity> findByStoryIdOrderBySceneOrder(UUID storyId);

    // حذف مجمّع داخل معاملته الخاصة — يعمل بأمان داخل مهمة @Async بلا سياق معاملة خارجي
    @Modifying
    @Transactional
    @Query("delete from StorySceneEntity s where s.storyId = :storyId")
    void deleteByStoryId(UUID storyId);
}
