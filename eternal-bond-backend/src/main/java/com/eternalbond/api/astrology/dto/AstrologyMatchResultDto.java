package com.eternalbond.api.astrology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Internal DTO representing the result of an Ashtakoot compatibility calculation.
 *
 * This is the ONLY type that crosses the service-to-controller boundary.
 * External API models (AstrologyMatchResponse etc.) must never be exposed beyond
 * the astrology.client package.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AstrologyMatchResultDto {

    /** Total Ashtakoot score received (out of totalPoints, max 36). */
    private double receivedPoints;

    /** Maximum possible score (always 36 in the Ashtakoot system). */
    private double totalPoints;

    /** Whether the API considers the match favorable. */
    private boolean matchFavorable;

    /** Human-readable conclusion from the API. */
    private String conclusionMessage;

    // ── Individual Koota breakdowns ─────────────────────────────────────────
    private KootaInfo varna;
    private KootaInfo vashya;
    private KootaInfo tara;
    private KootaInfo yoni;
    private KootaInfo grahaMaitri;
    private KootaInfo gana;
    private KootaInfo bhakoot;
    private KootaInfo nadi;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KootaInfo {
        private double receivedPoints;
        private double totalPoints;
        private String maleAttribute;
        private String femaleAttribute;
        private String description;
    }
}
