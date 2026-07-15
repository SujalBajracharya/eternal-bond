package com.eternalbond.api.astrology.profile;

import org.springframework.stereotype.Component;

@Component
public class ProfileKundaliMapper {

    public ProfileKundaliEntity toEntity(CreateKundaliProfileRequest request, String profileId) {
        if (request == null) {
            return null;
        }
        return ProfileKundaliEntity.builder()
                .profileId(profileId)
                .birthDate(request.getBirthDate())
                .birthTime(request.getBirthTime())
                .birthPlace(request.getBirthPlace())
                .birthLatitude(request.getBirthLatitude())
                .birthLongitude(request.getBirthLongitude())
                .birthTimezone(request.getBirthTimezone())
                .build();
    }

    public KundaliProfileResponse toResponse(ProfileKundaliEntity entity) {
        if (entity == null) {
            return null;
        }
        return KundaliProfileResponse.builder()
                .id(entity.getId())
                .profileId(entity.getProfileId())
                .birthDate(entity.getBirthDate())
                .birthTime(entity.getBirthTime())
                .birthPlace(entity.getBirthPlace())
                .birthLatitude(entity.getBirthLatitude())
                .birthLongitude(entity.getBirthLongitude())
                .birthTimezone(entity.getBirthTimezone())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
