package com.eternalbond.api.astrology.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Raw response model from the Free Astrology API (json.freeastrologyapi.com).
 *
 * <p>The actual API response is wrapped in an {@code output} object at the top level:
 * <pre>
 * {
 *   "statusCode": 200,
 *   "output": {
 *     "out_of": 36,
 *     "total_score": 11.5,
 *     "varna_kootam":      { "score": 0,   "out_of": 1, "bride": {...}, "groom": {...} },
 *     "vasya_kootam":      { "score": 0.5, "out_of": 2, ... },
 *     "tara_kootam":       { "score": 1.5, "out_of": 3, ... },
 *     "yoni_kootam":       { "score": 2,   "out_of": 4, ... },
 *     "graha_maitri_kootam": { "score": 0.5, "out_of": 5, ... },
 *     "gana_kootam":       { "score": 0,   "out_of": 6, ... },
 *     "rasi_kootam":       { "score": 7,   "out_of": 7, ... },
 *     "nadi_kootam":       { "score": 0,   "out_of": 8, ... }
 *   }
 * }
 * </pre>
 *
 * <p>The {@link AstrologyApiClient} is responsible for extracting the {@code output} node
 * before deserializing into this class. This class therefore represents the {@code output}
 * object directly.
 *
 * <p>This class is INTERNAL to the client package and must NOT be exposed to controllers.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AstrologyMatchResponse {

    /** Maximum possible score — should always be 36. */
    @JsonProperty("out_of")
    private double outOf;

    /** Total compatibility score received (0–36). */
    @JsonProperty("total_score")
    private double totalScore;

    @JsonProperty("varna_kootam")
    private KootaDetail varnaKootam;

    /** Note: the API uses "vasya" (not "vashya") in the JSON key. */
    @JsonProperty("vasya_kootam")
    private KootaDetail vasyaKootam;

    @JsonProperty("tara_kootam")
    private KootaDetail taraKootam;

    @JsonProperty("yoni_kootam")
    private KootaDetail yoniKootam;

    @JsonProperty("graha_maitri_kootam")
    private KootaDetail grahaMaitriKootam;

    @JsonProperty("gana_kootam")
    private KootaDetail ganaKootam;

    /**
     * Bhakoot is called "rasi_kootam" by this API.
     * Internally we expose it as bhakoot to match the Ashtakoot system naming.
     */
    @JsonProperty("rasi_kootam")
    private KootaDetail rasiKootam;

    @JsonProperty("nadi_kootam")
    private KootaDetail nadiKootam;

    // ── Inner types ────────────────────────────────────────────────────────────

    /**
     * Represents a single Koota (category) in the Ashtakoot breakdown.
     * The API returns {@code score} and {@code out_of} for each Koota,
     * plus {@code bride} / {@code groom} sub-objects with sign/star details.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class KootaDetail {

        /** Points received for this Koota. */
        @JsonProperty("score")
        private double score;

        /** Maximum possible points for this Koota. */
        @JsonProperty("out_of")
        private double outOf;

        /** Bride-side details (moon sign, star, yoni, etc.). */
        @JsonProperty("bride")
        private PartyDetail bride;

        /** Groom-side details. */
        @JsonProperty("groom")
        private PartyDetail groom;
    }

    /**
     * Details for one party (bride or groom) within a Koota.
     * Fields vary by Koota type — all are optional and ignored if absent.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PartyDetail {

        @JsonProperty("moon_sign")
        private String moonSign;

        @JsonProperty("moon_sign_number")
        private Integer moonSignNumber;

        @JsonProperty("star_name")
        private String starName;

        @JsonProperty("star_number")
        private Integer starNumber;

        @JsonProperty("yoni")
        private String yoni;

        @JsonProperty("varnam_name")
        private String varnamName;

        @JsonProperty("nadi_name")
        private String nadiName;

        // vasya_kootam specific
        @JsonProperty("bride_kootam_name")
        private String brideKootamName;

        @JsonProperty("groom_kootam_name")
        private String groomKootamName;

        // gana_kootam specific
        @JsonProperty("bride_nadi_name")
        private String brideNadiName;

        @JsonProperty("groom_nadi_name")
        private String groomNadiName;

        // moon sign lord (graha_maitri)
        @JsonProperty("moon_sign_lord_name")
        private String moonSignLordName;
    }
}
