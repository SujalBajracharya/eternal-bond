package com.eternalbond.api.astrology.profile;

import com.eternalbond.api.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
public class ProfileKundaliService {

    private final ProfileKundaliRepository repository;
    private final ProfileKundaliMapper mapper;

    public ProfileKundaliService(ProfileKundaliRepository repository, ProfileKundaliMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional
    public KundaliProfileResponse createProfile(String profileId, CreateKundaliProfileRequest request) {
        if (repository.existsByProfileId(profileId)) {
            throw new IllegalArgumentException("Kundali profile already exists for this user.");
        }
        ProfileKundaliEntity entity = mapper.toEntity(request, profileId);
        ProfileKundaliEntity saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Transactional
    public KundaliProfileResponse updateProfile(String profileId, UpdateKundaliProfileRequest request) {
        ProfileKundaliEntity entity = repository.findByProfileId(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Kundali profile not found for this user."));

        entity.setBirthDate(request.getBirthDate());
        entity.setBirthTime(request.getBirthTime());
        entity.setBirthPlace(request.getBirthPlace());
        entity.setBirthLatitude(request.getBirthLatitude());
        entity.setBirthLongitude(request.getBirthLongitude());
        entity.setBirthTimezone(request.getBirthTimezone());
        entity.setUpdatedAt(OffsetDateTime.now());

        ProfileKundaliEntity saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public KundaliProfileResponse getProfile(String profileId) {
        ProfileKundaliEntity entity = repository.findByProfileId(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Kundali profile not found for this user."));
        return mapper.toResponse(entity);
    }

    @Transactional
    public void deleteProfile(String profileId) {
        ProfileKundaliEntity entity = repository.findByProfileId(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Kundali profile not found for this user."));
        repository.delete(entity);
    }
}
