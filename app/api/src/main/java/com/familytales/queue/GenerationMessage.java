package com.familytales.queue;

import java.util.UUID;

/** رسالة مهمة توليد في الطابور. */
public record GenerationMessage(UUID jobId, UUID storyId, UUID familyId, int sceneCount, boolean watermark) {}
