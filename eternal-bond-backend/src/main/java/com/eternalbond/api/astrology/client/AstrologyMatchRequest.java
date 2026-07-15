package com.eternalbond.api.astrology.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * External request payload sent to the Free Astrology API.
 * Encapsulates birth details for both the male and female participants.
 * This class is INTERNAL to the client package and must NOT be exposed to controllers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AstrologyMatchRequest {
    private AstrologyPersonBirthDetails male;
    private AstrologyPersonBirthDetails female;
}
