package com.familytales.render;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface GenerationJobRepository extends JpaRepository<GenerationJobEntity, UUID> {
}
