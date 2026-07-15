package com.eternalbond.api.astrology.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateKundaliProfileRequest {

    @NotNull(message = "Birth date is required")
    private LocalDate birthDate;

    @NotNull(message = "Birth time is required")
    private LocalTime birthTime;

    @NotBlank(message = "Birth place is required")
    private String birthPlace;

    @NotNull(message = "Birth latitude is required")
    private Double birthLatitude;

    @NotNull(message = "Birth longitude is required")
    private Double birthLongitude;

    @NotNull(message = "Birth timezone is required")
    private Double birthTimezone;
}
