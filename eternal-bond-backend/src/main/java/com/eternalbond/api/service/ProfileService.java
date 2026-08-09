package com.eternalbond.api.service;

import com.eternalbond.api.dto.ProfileDto;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.DailyMatch;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.model.ProfilePreferences;
import com.eternalbond.api.repository.DailyMatchRepository;
import com.eternalbond.api.repository.ProfilePreferencesRepository;
import com.eternalbond.api.repository.ProfileRepository;
import com.eternalbond.api.repository.SwipeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);
    private static final int DAILY_BATCH_SIZE = 5;

    private final ProfileRepository profileRepository;
    private final ProfilePreferencesRepository profilePreferencesRepository;
    private final DailyMatchRepository dailyMatchRepository;
    private final SwipeRepository swipeRepository;

    public ProfileService(ProfileRepository profileRepository,
            ProfilePreferencesRepository profilePreferencesRepository,
            DailyMatchRepository dailyMatchRepository,
            SwipeRepository swipeRepository) {
        this.profileRepository = profileRepository;
        this.profilePreferencesRepository = profilePreferencesRepository;
        this.dailyMatchRepository = dailyMatchRepository;
        this.swipeRepository = swipeRepository;
    }

    @Transactional(readOnly = true)
    public ProfileDto getProfile(String id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found with ID: " + id));
        return mapToDto(profile);
    }

    @Transactional
    public ProfileDto updateProfile(String id, ProfileDto dto) {
        Profile profile = profileRepository.findById(id).orElseGet(() -> {
            Profile newProfile = new Profile();
            newProfile.setId(id);
            return newProfile;
        });

        profile.setFullName(dto.getFullName());
        profile.setGender(dto.getGender());
        profile.setDateOfBirth(dto.getDateOfBirth());
        profile.setLocation(dto.getLocation());
        profile.setBio(dto.getBio());
        profile.setProfession(dto.getProfession());
        profile.setReligion(dto.getReligion());
        profile.setMotherTongue(dto.getMotherTongue());
        profile.setHeightCm(dto.getHeightCm());
        profile.setMaritalStatus(dto.getMaritalStatus());
        profile.setLookingFor(dto.getLookingFor());
        profile.setAvatarUrl(dto.getAvatarUrl());
        profile.setPhone(dto.getPhone());
        profile.setEmail(dto.getEmail());
        profile.setHighestEducation(dto.getHighestEducation());
        profile.setIncomeRange(dto.getIncomeRange());
        profile.setFatherOccupation(dto.getFatherOccupation());
        profile.setMotherOccupation(dto.getMotherOccupation());
        profile.setSiblings(dto.getSiblings());
        profile.setFamilyType(dto.getFamilyType());
        profile.setPhotos(dto.getPhotos());
        profile.setSocialLinks(dto.getSocialLinks());
        profile.setKundaliName(dto.getKundaliName());
        profile.setKundaliUrl(dto.getKundaliUrl());
        profile.setCitizenshipFrontUrl(dto.getCitizenshipFrontUrl());
        profile.setCitizenshipBackUrl(dto.getCitizenshipBackUrl());
        profile.setMarriageIntention(dto.getMarriageIntention());
        profile.setOpenToRelocate(dto.getOpenToRelocate());

        if (dto.getPhotoVisibility() != null) {
            profile.setPhotoVisibility(dto.getPhotoVisibility());
        }
        if (dto.getProfileVisibility() != null) {
            profile.setProfileVisibility(dto.getProfileVisibility());
        }

        // Complete check: if core onboarding questions are present
        boolean isComplete = profile.getFullName() != null &&
                profile.getGender() != null &&
                profile.getDateOfBirth() != null &&
                profile.getLocation() != null &&
                profile.getHighestEducation() != null;
        profile.setProfileCompleted(isComplete);
        profile.setUpdatedAt(LocalDateTime.now());

        Profile saved = profileRepository.save(profile);
        return mapToDto(saved);
    }

    /**
     * Returns the user's daily batch of up to 5 recommended profiles.
     *
     * <p>Same-day idempotency: if a batch already exists for {@code userId} on
     * today's calendar date, those exact records are returned immediately without
     * re-running any eligibility logic.
     *
     * <p>New-day generation: on the first request of a new calendar day:
     * <ol>
     *   <li>Fetch all eligible candidates via {@code findDailyMatchesForUser} (excludes own
     *       profile and already-swiped profiles at the DB level).</li>
     *   <li>Apply the user's active {@link ProfilePreferences} filters in-memory.</li>
     *   <li>Exclude any profile that appeared in a previous day's batch for this user.</li>
     *   <li>Select up to 5, persist them as {@link DailyMatch} rows, and return them.</li>
     * </ol>
     *
     * <p>Concurrency: If two simultaneous requests both find no existing batch they both
     * attempt to persist. The unique constraint {@code uq_daily_match_user_profile_date}
     * causes the second write to throw a {@link DataIntegrityViolationException}.  That
     * exception is caught and we fall back to reading the batch the first request committed.
     */
    @Transactional
    public List<ProfileDto> getDailyMatches(String userId) {
        Profile userProfile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Active profile not found"));

        LocalDate today = LocalDate.now();

        // ── Same-day idempotency check ──────────────────────────────────────────
        if (dailyMatchRepository.existsByUserIdAndMatchDate(userId, today)) {
            log.debug("Returning existing daily batch for user={} date={}", userId, today);
            return loadPersistedBatch(userId, today);
        }

        // ── Build eligibility candidate list ───────────────────────────────────
        List<Profile> candidates = profileRepository.findDailyMatchesForUser(
                userId, userProfile.getLookingFor());

        // Apply active preferences filter (identical to original logic)
        ProfilePreferences pref = profilePreferencesRepository
                .findByProfileIdAndIsActiveTrue(userId)
                .orElse(null);

        if (pref != null) {
            candidates = applyPreferencesFilter(candidates, pref);
        }

        // Exclude profiles already shown on any previous day
        Set<String> alreadySeen = new HashSet<>(
                dailyMatchRepository.findAlreadyRecommendedProfileIds(userId, today));

        List<Profile> newCandidates = candidates.stream()
                .filter(p -> !alreadySeen.contains(p.getId()))
                .limit(DAILY_BATCH_SIZE)
                .collect(Collectors.toList());

        if (newCandidates.isEmpty()) {
            log.info("No new eligible profiles for user={} on date={}", userId, today);
            return Collections.emptyList();
        }

        // ── Persist the batch ─────────────────────────────────────────────────
        try {
            persistBatch(userId, today, newCandidates);
        } catch (DataIntegrityViolationException ex) {
            // A concurrent request already committed the batch; read it back.
            log.warn("Concurrent batch creation detected for user={} date={}, reading committed batch.", userId, today);
            return loadPersistedBatch(userId, today);
        }

        return newCandidates.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Reads an already-persisted batch from the DB and maps to DTOs. */
    private List<ProfileDto> loadPersistedBatch(String userId, LocalDate date) {
        List<DailyMatch> batch = dailyMatchRepository
                .findByUserIdAndMatchDateOrderBySortOrderAsc(userId, date);

        if (batch.isEmpty()) {
            return Collections.emptyList();
        }

        // Bulk-fetch the profiles to avoid N+1
        List<String> ids = batch.stream()
                .map(DailyMatch::getRecommendedProfileId)
                .collect(Collectors.toList());

        Set<String> swipedIds = swipeRepository.findSwipedIdsBySwiperIdAndSwipedIds(userId, ids);

        Map<String, Profile> profileMap = profileRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Profile::getId, p -> p));

        return batch.stream()
                .filter(dm -> !swipedIds.contains(dm.getRecommendedProfileId()))
                .map(dm -> profileMap.get(dm.getRecommendedProfileId()))
                .filter(Objects::nonNull)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /** Inserts one DailyMatch row per selected profile, assigning sort_order = index. */
    private void persistBatch(String userId, LocalDate today, List<Profile> selected) {
        List<DailyMatch> rows = new ArrayList<>();
        for (int i = 0; i < selected.size(); i++) {
            rows.add(DailyMatch.builder()
                    .userId(userId)
                    .recommendedProfileId(selected.get(i).getId())
                    .matchDate(today)
                    .sortOrder(i)
                    .build());
        }
        dailyMatchRepository.saveAll(rows);
        log.info("Persisted {} daily matches for user={} on date={}", rows.size(), userId, today);
    }

    /**
     * Applies the user's active {@link ProfilePreferences} filters to a candidate list.
     * Logic is identical to the original implementation — no eligibility rules removed.
     */
    private List<Profile> applyPreferencesFilter(List<Profile> candidates, ProfilePreferences pref) {
        return candidates.stream().filter(p -> {
            // 1. Age range filter
            if (p.getDateOfBirth() != null) {
                int age = java.time.Period.between(p.getDateOfBirth(), java.time.LocalDate.now()).getYears();
                if (pref.getPrefAgeMin() != null && age < pref.getPrefAgeMin())
                    return false;
                if (pref.getPrefAgeMax() != null && age > pref.getPrefAgeMax())
                    return false;
            }

            // 2. Height range filter
            if (p.getHeightCm() != null) {
                if (pref.getPrefHeightMin() != null && p.getHeightCm() < pref.getPrefHeightMin())
                    return false;
                if (pref.getPrefHeightMax() != null && p.getHeightCm() > pref.getPrefHeightMax())
                    return false;
            }

            // 3. Location filter (comma separated)
            if (pref.getPrefLocation() != null && !pref.getPrefLocation().trim().isEmpty()) {
                if (p.getLocation() == null)
                    return false;
                String loc = p.getLocation().toLowerCase().trim();
                boolean matched = false;
                for (String val : pref.getPrefLocation().split(",")) {
                    if (loc.contains(val.toLowerCase().trim()) || val.toLowerCase().trim().contains(loc)) {
                        matched = true;
                        break;
                    }
                }
                if (!matched)
                    return false;
            }

            // 4. Religion filter
            if (pref.getPrefReligion() != null && !pref.getPrefReligion().trim().isEmpty() &&
                    !pref.getPrefReligion().equalsIgnoreCase("No preference")) {
                if (p.getReligion() == null || !p.getReligion().equalsIgnoreCase(pref.getPrefReligion().trim())) {
                    return false;
                }
            }

            // 5. Intention filter
            if (pref.getPrefIntention() != null && !pref.getPrefIntention().trim().isEmpty() &&
                    !pref.getPrefIntention().equalsIgnoreCase("When right")) {
                if (p.getMarriageIntention() == null
                        || !p.getMarriageIntention().equalsIgnoreCase(pref.getPrefIntention().trim())) {
                    return false;
                }
            }

            // 6. Education filter (comma separated)
            if (pref.getPrefEducation() != null && !pref.getPrefEducation().trim().isEmpty()) {
                if (p.getHighestEducation() == null)
                    return false;
                String edu = p.getHighestEducation().name().toLowerCase();
                boolean matched = false;
                for (String val : pref.getPrefEducation().split(",")) {
                    if (val.toLowerCase().trim().replace(" ", "_").contains(edu) ||
                            edu.contains(val.toLowerCase().trim().replace(" ", "_"))) {
                        matched = true;
                        break;
                    }
                }
                if (!matched)
                    return false;
            }

            // 7. Profession filter (comma separated)
            if (pref.getPrefProfession() != null && !pref.getPrefProfession().trim().isEmpty()) {
                if (p.getProfession() == null)
                    return false;
                String prof = p.getProfession().toLowerCase().trim();
                boolean matched = false;
                for (String val : pref.getPrefProfession().split(",")) {
                    if (prof.contains(val.toLowerCase().trim()) || val.toLowerCase().trim().contains(prof)) {
                        matched = true;
                        break;
                    }
                }
                if (!matched)
                    return false;
            }

            // 8. Verified filter
            if (pref.getPrefVerifiedOnly() != null && pref.getPrefVerifiedOnly()) {
                if (p.getKycStatus() == null || p.getKycStatus() != Profile.KycStatus.verified) {
                    return false;
                }
            }

            return true;
        }).collect(Collectors.toList());
    }

    public ProfileDto mapToDto(Profile profile) {
        return ProfileDto.builder()
                .id(profile.getId())
                .fullName(profile.getFullName())
                .gender(profile.getGender())
                .dateOfBirth(profile.getDateOfBirth())
                .location(profile.getLocation())
                .bio(profile.getBio())
                .profession(profile.getProfession())
                .religion(profile.getReligion())
                .motherTongue(profile.getMotherTongue())
                .heightCm(profile.getHeightCm())
                .maritalStatus(profile.getMaritalStatus())
                .lookingFor(profile.getLookingFor())
                .avatarUrl(profile.getAvatarUrl())
                .phone(profile.getPhone())
                .email(profile.getEmail())
                .profileCompleted(profile.isProfileCompleted())
                .highestEducation(profile.getHighestEducation())
                .incomeRange(profile.getIncomeRange())
                .fatherOccupation(profile.getFatherOccupation())
                .motherOccupation(profile.getMotherOccupation())
                .siblings(profile.getSiblings())
                .familyType(profile.getFamilyType())
                .photos(profile.getPhotos())
                .socialLinks(profile.getSocialLinks())
                .kundaliName(profile.getKundaliName())
                .kundaliUrl(profile.getKundaliUrl())
                .citizenshipFrontUrl(profile.getCitizenshipFrontUrl())
                .citizenshipBackUrl(profile.getCitizenshipBackUrl())
                .kycStatus(profile.getKycStatus())
                .photoVisibility(profile.getPhotoVisibility())
                .profileVisibility(profile.getProfileVisibility())
                .marriageIntention(profile.getMarriageIntention())
                .openToRelocate(profile.getOpenToRelocate())
                .build();
    }
}
