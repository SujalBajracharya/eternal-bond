package com.eternalbond.api.service;

import com.eternalbond.api.dto.PreferencesDto;
import com.eternalbond.api.model.ProfilePreferences;
import com.eternalbond.api.repository.ProfilePreferencesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
public class PreferencesService {

    private final ProfilePreferencesRepository repository;

    public PreferencesService(ProfilePreferencesRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PreferencesDto getActivePreferences(String profileId) {
        return repository.findByProfileIdAndIsActiveTrue(profileId)
                .map(this::mapToDto)
                .orElse(null);
    }

    @Transactional
    public PreferencesDto savePreferences(String profileId, PreferencesDto dto) {
        String presetName = dto.getPresetName() != null ? dto.getPresetName() : "default";

        // Deactivate all other presets for this user, then upsert the new active one
        repository.findByProfileIdAndIsActiveTrue(profileId)
                .ifPresent(existing -> {
                    existing.setIsActive(false);
                    repository.save(existing);
                });

        ProfilePreferences pref = repository
                .findByProfileIdAndPresetName(profileId, presetName)
                .orElseGet(() -> {
                    ProfilePreferences p = new ProfilePreferences();
                    p.setProfileId(profileId);
                    p.setPresetName(presetName);
                    return p;
                });

        pref.setIsActive(true);
        pref.setPrefAgeMin(dto.getPrefAgeMin() != null ? dto.getPrefAgeMin() : 21);
        pref.setPrefAgeMax(dto.getPrefAgeMax() != null ? dto.getPrefAgeMax() : 50);
        pref.setPrefHeightMin(dto.getPrefHeightMin() != null ? dto.getPrefHeightMin() : 140);
        pref.setPrefHeightMax(dto.getPrefHeightMax() != null ? dto.getPrefHeightMax() : 200);
        pref.setPrefLocation(dto.getPrefLocation() != null ? dto.getPrefLocation() : "");
        pref.setPrefRelocate(dto.getPrefRelocate() != null ? dto.getPrefRelocate() : "any");
        pref.setPrefEducation(dto.getPrefEducation() != null ? dto.getPrefEducation() : "");
        pref.setPrefProfession(dto.getPrefProfession() != null ? dto.getPrefProfession() : "");
        pref.setPrefReligion(dto.getPrefReligion() != null ? dto.getPrefReligion() : "No preference");
        pref.setPrefIntention(dto.getPrefIntention() != null ? dto.getPrefIntention() : "When right");
        pref.setPrefVerifiedOnly(dto.getPrefVerifiedOnly() != null ? dto.getPrefVerifiedOnly() : false);
        pref.setPrefFamilyAssisted(dto.getPrefFamilyAssisted() != null ? dto.getPrefFamilyAssisted() : false);
        pref.setUpdatedAt(OffsetDateTime.now());

        ProfilePreferences saved = repository.save(pref);
        return mapToDto(saved);
    }

    private PreferencesDto mapToDto(ProfilePreferences p) {
        return PreferencesDto.builder()
                .presetName(p.getPresetName())
                .isActive(p.getIsActive())
                .prefAgeMin(p.getPrefAgeMin())
                .prefAgeMax(p.getPrefAgeMax())
                .prefHeightMin(p.getPrefHeightMin())
                .prefHeightMax(p.getPrefHeightMax())
                .prefLocation(p.getPrefLocation())
                .prefRelocate(p.getPrefRelocate())
                .prefEducation(p.getPrefEducation())
                .prefProfession(p.getPrefProfession())
                .prefReligion(p.getPrefReligion())
                .prefIntention(p.getPrefIntention())
                .prefVerifiedOnly(p.getPrefVerifiedOnly())
                .prefFamilyAssisted(p.getPrefFamilyAssisted())
                .build();
    }
}
