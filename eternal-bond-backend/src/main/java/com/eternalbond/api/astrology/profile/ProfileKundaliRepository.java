package com.eternalbond.api.astrology.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileKundaliRepository extends JpaRepository<ProfileKundaliEntity, UUID> {
    Optional<ProfileKundaliEntity> findByProfileId(String profileId);
    boolean existsByProfileId(String profileId);
}
