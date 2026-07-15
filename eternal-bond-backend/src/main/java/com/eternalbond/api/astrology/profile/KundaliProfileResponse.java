package com.eternalbond.api.astrology.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KundaliProfileResponse {
    private UUID id;
    private String profileId;
    private LocalDate birthDate;
    private LocalTime birthTime;
    private String birthPlace;
    private Double birthLatitude;
    private Double birthLongitude;
    private Double birthTimezone;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
