package com.eternalbond.api.astrology.service;

import com.eternalbond.api.astrology.client.AstrologyApiClient;
import com.eternalbond.api.astrology.client.AstrologyMatchRequest;
import com.eternalbond.api.astrology.client.AstrologyMatchResponse;
import com.eternalbond.api.astrology.client.AstrologyPersonBirthDetails;
import com.eternalbond.api.astrology.dto.AstrologyMatchResultDto;
import com.eternalbond.api.astrology.profile.ProfileKundaliEntity;
import com.eternalbond.api.astrology.profile.ProfileKundaliRepository;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Orchestrates end-to-end Ashtakoot (Guna Milan) compatibility calculations.
 *
 * <p>Flow:
 * <ol>
 *   <li>Verify both {@link Profile} records exist.</li>
 *   <li>Verify both {@link ProfileKundaliEntity} records exist → 404 if not.</li>
 *   <li>Validate all required birth fields are populated → 400 if not.</li>
 *   <li>Assign the "male" / "female" API slots using {@code profile.gender}.</li>
 *   <li>Convert {@link ProfileKundaliEntity} fields into {@link AstrologyPersonBirthDetails}.</li>
 *   <li>Invoke {@link AstrologyApiClient} and map the raw response to an internal DTO.</li>
 * </ol>
 *
 * <p>External API models ({@code AstrologyMatchRequest}, {@code AstrologyMatchResponse}, etc.)
 * are strictly confined to this class and the {@code astrology.client} package.
 * They are never propagated to callers.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AstrologyMatchService {

    private final AstrologyApiClient     astrologyApiClient;
    private final ProfileKundaliRepository kundaliRepository;
    private final ProfileRepository       profileRepository;

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Calculates the Ashtakoot compatibility score between two users.
     *
     * @param profileId1 authenticated user's profile ID
     * @param profileId2 target user's profile ID
     * @return {@link AstrologyMatchResultDto} with per-Koota breakdown and total score
     * @throws ResourceNotFoundException if either profile or Kundali entry is missing
     * @throws IllegalArgumentException  if required birth fields are absent in either entry
     */
    @Transactional(readOnly = true)
    public AstrologyMatchResultDto calculateAshtakootScore(String profileId1, String profileId2) {
        log.info("Calculating Ashtakoot score — profile1: {}, profile2: {}", profileId1, profileId2);

        // ── Step 1: Load both Profile records ────────────────────────────────
        Profile profile1 = profileRepository.findById(profileId1)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Profile not found: " + profileId1));

        Profile profile2 = profileRepository.findById(profileId2)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Profile not found: " + profileId2));

        // ── Step 2: Load both Kundali records ────────────────────────────────
        ProfileKundaliEntity kundali1 = kundaliRepository.findByProfileId(profileId1)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Kundali profile not found for user. Please complete your birth details first."));

        ProfileKundaliEntity kundali2 = kundaliRepository.findByProfileId(profileId2)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Kundali profile not found for the target user."));

        // ── Step 3: Validate required birth fields ────────────────────────────
        validateKundaliFields(kundali1, "your");
        validateKundaliFields(kundali2, "target user's");

        // ── Step 4: Assign male / female API slots using gender ───────────────
        //    Rules (evaluated in order):
        //      a) profile1=female  AND profile2=male  → swap (profile1 is female slot)
        //      b) profile1=male    AND profile2=female → natural order
        //      c) any other combination (same gender / other / null) → profile1=male by default
        AstrologyPersonBirthDetails maleDetails;
        AstrologyPersonBirthDetails femaleDetails;

        boolean profile1IsFemale = Profile.GenderType.female.equals(profile1.getGender());
        boolean profile1IsMale   = Profile.GenderType.male.equals(profile1.getGender());
        boolean profile2IsFemale = Profile.GenderType.female.equals(profile2.getGender());
        boolean profile2IsMale   = Profile.GenderType.male.equals(profile2.getGender());

        if (profile1IsFemale && profile2IsMale) {
            // Cross-gender: profile2 is male, profile1 is female
            maleDetails   = toBirthDetails(kundali2);
            femaleDetails = toBirthDetails(kundali1);
            log.debug("Gender assignment: profile2 → male slot, profile1 → female slot");
        } else {
            // Natural or same-gender: profile1 takes the male slot
            maleDetails   = toBirthDetails(kundali1);
            femaleDetails = toBirthDetails(kundali2);
            log.debug("Gender assignment: profile1 → male slot, profile2 → female slot");
        }

        // ── Step 5: Build request and call external API ───────────────────────
        AstrologyMatchRequest request = AstrologyMatchRequest.builder()
                .male(maleDetails)
                .female(femaleDetails)
                .build();

        log.info("Sending Ashtakoot request — male birth: {}/{}/{}, female birth: {}/{}/{}",
                maleDetails.getYear(), maleDetails.getMonth(), maleDetails.getDate(),
                femaleDetails.getYear(), femaleDetails.getMonth(), femaleDetails.getDate());

        AstrologyMatchResponse apiResponse = astrologyApiClient.fetchAshtakootScore(request);

        // The external client model uses `totalScore` / `outOf` naming.
        log.info("Ashtakoot score received — {}/{}",
                apiResponse.getTotalScore(), apiResponse.getOutOf());

        // ── Step 6: Map external response → internal DTO ─────────────────────
        return mapToInternalDto(apiResponse);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Validates that all fields required by the external API are present.
     * Throws {@link IllegalArgumentException} (→ HTTP 400) listing every missing field.
     *
     * @param kundali    the entity to validate
     * @param ownerLabel short label used in the error message (e.g. "your" / "target user's")
     */
    private void validateKundaliFields(ProfileKundaliEntity kundali, String ownerLabel) {
        List<String> missing = new ArrayList<>();

        if (kundali.getBirthDate() == null)       missing.add("birth date");
        if (kundali.getBirthTime() == null)       missing.add("birth time");
        if (kundali.getBirthLatitude() == null)   missing.add("birth latitude");
        if (kundali.getBirthLongitude() == null)  missing.add("birth longitude");
        if (kundali.getBirthTimezone() == null)   missing.add("birth timezone");

        if (!missing.isEmpty()) {
            String fields = String.join(", ", missing);
            throw new IllegalArgumentException(
                    "Incomplete Kundali data in " + ownerLabel + " profile. "
                    + "Missing required fields: " + fields + ". "
                    + "Please update your birth details and try again.");
        }
    }

    /**
     * Converts a {@link ProfileKundaliEntity} into the external API's birth-detail format.
     * Field presence is guaranteed by {@link #validateKundaliFields} before this is called.
     *
     * @param kundali validated Kundali entity
     * @return {@link AstrologyPersonBirthDetails} ready for the API request
     */
    private AstrologyPersonBirthDetails toBirthDetails(ProfileKundaliEntity kundali) {
        return AstrologyPersonBirthDetails.builder()
                // Date decomposed from LocalDate
                .year(kundali.getBirthDate().getYear())
                .month(kundali.getBirthDate().getMonthValue())
                .date(kundali.getBirthDate().getDayOfMonth())
                // Time decomposed from LocalTime
                .hours(kundali.getBirthTime().getHour())
                .minutes(kundali.getBirthTime().getMinute())
                .seconds(kundali.getBirthTime().getSecond())
                // Coordinates & timezone offset in decimal hours
                .latitude(kundali.getBirthLatitude())
                .longitude(kundali.getBirthLongitude())
                .timezone(kundali.getBirthTimezone())
                .build();
    }

    /**
     * Maps the raw external {@link AstrologyMatchResponse} to the internal
     * {@link AstrologyMatchResultDto}. No external types leak beyond this boundary.
     */
    private AstrologyMatchResultDto mapToInternalDto(AstrologyMatchResponse r) {
        // totalPoints should always be 36, but we guard against a malformed response
        double total = r.getOutOf() > 0 ? r.getOutOf() : 36.0;

        // receivedPoints is named `totalScore` in the client model
        double received = r.getTotalScore();

        // Derive favorability locally (Ashtakoot common threshold is 18/36)
        boolean favourable = received >= 18.0;

        return AstrologyMatchResultDto.builder()
                .receivedPoints(received)
                .totalPoints(total)
                .matchFavorable(favourable)
                .conclusionMessage(null)
                // Per-Koota breakdown — client uses *Kootam suffix fields*
                .varna(mapKoota(r.getVarnaKootam()))
                .vashya(mapKoota(r.getVasyaKootam()))
                .tara(mapKoota(r.getTaraKootam()))
                .yoni(mapKoota(r.getYoniKootam()))
                .grahaMaitri(mapKoota(r.getGrahaMaitriKootam()))
                .gana(mapKoota(r.getGanaKootam()))
                .bhakoot(mapKoota(r.getRasiKootam()))
                .nadi(mapKoota(r.getNadiKootam()))
                .build();
    }

    /**
     * Safely maps a nullable {@link AstrologyMatchResponse.KootaDetail} to a
     * {@link AstrologyMatchResultDto.KootaInfo}. Returns {@code null} if the
     * API omitted that Koota from the response.
     */
        private AstrologyMatchResultDto.KootaInfo mapKoota(AstrologyMatchResponse.KootaDetail detail) {
                if (detail == null) return null;
                double received = detail.getScore();
                double total = detail.getOutOf();

                // Extract male/female attributes from the party details where available
                String maleAttr = null;
                String femaleAttr = null;
                if (detail.getGroom() != null) {
                        // prefer varnamName / groom_kootam_name / starName / moonSign
                        maleAttr = detail.getGroom().getVarnamName();
                        if (maleAttr == null) maleAttr = detail.getGroom().getGroomKootamName();
                        if (maleAttr == null) maleAttr = detail.getGroom().getStarName();
                        if (maleAttr == null && detail.getGroom().getMoonSign() != null)
                                maleAttr = detail.getGroom().getMoonSign();
                        if (maleAttr == null) maleAttr = detail.getGroom().getYoni();
                        if (maleAttr == null) maleAttr = detail.getGroom().getNadiName();
                }
                if (detail.getBride() != null) {
                        femaleAttr = detail.getBride().getVarnamName();
                        if (femaleAttr == null) femaleAttr = detail.getBride().getBrideKootamName();
                        if (femaleAttr == null) femaleAttr = detail.getBride().getStarName();
                        if (femaleAttr == null && detail.getBride().getMoonSign() != null)
                                femaleAttr = detail.getBride().getMoonSign();
                        if (femaleAttr == null) femaleAttr = detail.getBride().getYoni();
                        if (femaleAttr == null) femaleAttr = detail.getBride().getNadiName();
                }

                return AstrologyMatchResultDto.KootaInfo.builder()
                                .receivedPoints(received)
                                .totalPoints(total)
                                .maleAttribute(maleAttr)
                                .femaleAttribute(femaleAttr)
                                .description(null)
                                .build();
        }
}
