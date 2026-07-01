package com.eternalbond.api.repository;

import com.eternalbond.api.model.ProfilePreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfilePreferencesRepository extends JpaRepository<ProfilePreferences, UUID> {
    Optional<ProfilePreferences> findByProfileIdAndIsActiveTrue(String profileId);
    Optional<ProfilePreferences> findByProfileIdAndPresetName(String profileId, String presetName);
}
