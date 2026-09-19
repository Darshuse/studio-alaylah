package com.familytales.family;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface FamilyRepository extends JpaRepository<FamilyEntity, UUID> {
    Optional<FamilyEntity> findFirstByOwnerId(UUID ownerId);
}
