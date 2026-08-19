package com.eternalbond.api.service;

import com.eternalbond.api.dto.ProfileDto;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.DailyMatch;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.model.ProfilePreferences;
import com.eternalbond.api.repository.DailyMatchRepository;
import com.eternalbond.api.repository.ProfilePreferencesRepository;
import com.eternalbond.api.repository.ProfileRepository;
import com.eternalbond.api.repository.PriorityInterestRepository;
import com.eternalbond.api.repository.SwipeRepository;
import com.eternalbond.api.repository.UserEntitlementRepository;
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
    /** Profiles recommended within this many days are excluded from today's batch. */
    private static final int RECOMMENDATION_WINDOW_DAYS = 30;

    private final ProfileRepository profileRepository;
    private final ProfilePreferencesRepository profilePreferencesRepository;
    private final DailyMatchRepository dailyMatchRepository;
    private final SwipeRepository swipeRepository;
    private final UserEntitlementRepository userEntitlementRepository;
    private final PriorityInterestRepository priorityInterestRepository;

    public ProfileService(ProfileRepository profileRepository,
            ProfilePreferencesRepository profilePreferencesRepository,
            DailyMatchRepository dailyMatchRepository,
            SwipeRepository swipeRepository,
            UserEntitlementRepository userEntitlementRepository,
            PriorityInterestRepository priorityInterestRepository) {
        this.profileRepository = profileRepository;
        this.profilePreferencesRepository = profilePreferencesRepository;
        this.dailyMatchRepository = dailyMatchRepository;
        this.swipeRepository = swipeRepository;
        this.userEntitlementRepository = userEntitlementRepository;
        this.priorityInterestRepository = priorityInterestRepository;
    }

    @Transactional(readOnly = true)
    public ProfileDto getProfile(String id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found with ID: " + id));
        return mapToDto(profile, false);
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
     * Returns the user's daily batch of up to {@value #DAILY_BATCH_SIZE} recommended profiles.
     *
     * <p><b>Same-day idempotency:</b> if a batch already exists for {@code userId} on
     * today's calendar date, those exact records are returned immediately without
     * re-running any eligibility logic.
     *
     * <p><b>New-day generation</b> — on the first request of a new calendar day:
     * <ol>
     *   <li>Fetch all eligible candidates via {@code findDailyMatchesForUser} (excludes own
     *       profile and already-swiped profiles permanently, at the DB level).</li>
     *   <li>Apply the user's active {@link ProfilePreferences} filters in-memory.</li>
     *   <li>Exclude profiles recommended within the last {@value #RECOMMENDATION_WINDOW_DAYS} days
     *       (the <em>recent window</em>) — these are temporarily unavailable.</li>
     *   <li>Select up to {@value #DAILY_BATCH_SIZE} fresh candidates and persist them.</li>
     *   <li><b>Recycling fallback:</b> if fewer than {@value #DAILY_BATCH_SIZE} fresh candidates
     *       exist, fill the remaining slots from eligible profiles that were last recommended
     *       <em>more than {@value #RECOMMENDATION_WINDOW_DAYS} days ago</em>. Swiped profiles
     *       are never recycled (they are permanently excluded at the DB level in step 1).</li>
     * </ol>
     *
     * <p><b>Concurrency:</b> if two simultaneous requests both find no existing batch they both
     * attempt to persist. The unique constraint {@code uq_daily_match_user_profile_date}
     * causes the second write to throw a {@link DataIntegrityViolationException}. That
     * exception is caught and the code falls back to reading the batch the first request
     * committed.
     */
    @Transactional
    public List<ProfileDto> getDailyMatches(String userId) {
        Profile userProfile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Active profile not found"));

        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.minusDays(RECOMMENDATION_WINDOW_DAYS);

        // ── Same-day idempotency check ──────────────────────────────────────────
        if (dailyMatchRepository.existsByUserIdAndMatchDate(userId, today)) {
            log.debug("Returning existing daily batch for user={} date={}", userId, today);
            return loadPersistedBatch(userId, today);
        }

        // ── Build eligibility candidate list ───────────────────────────────────
        // findDailyMatchesForUser already excludes the user's own profile AND any
        // profiles they have swiped on (permanent exclusion at the DB level).
        List<Profile> candidates = new ArrayList<>(profileRepository.findDailyMatchesForUser(
            userId, userProfile.getLookingFor()));

        // Apply active preferences filter
        ProfilePreferences pref = profilePreferencesRepository
                .findByProfileIdAndIsActiveTrue(userId)
                .orElse(null);
        if (pref != null) {
            candidates = applyPreferencesFilter(candidates, pref);
        }

        Set<String> premiumCandidateIds = activePriorityProfileIds(userId, candidates);
        candidates.sort(Comparator.comparing(
            profile -> !premiumCandidateIds.contains(profile.getId())));

        // ── 30-day rolling-window exclusion ────────────────────────────────────
        // Profiles recommended within the last RECOMMENDATION_WINDOW_DAYS days
        // are temporarily off-limits. Profiles older than the window become
        // eligible for recycling (provided they have not been swiped, which is
        // already guaranteed because findDailyMatchesForUser excluded them above).
        Set<String> recentlySeen = new HashSet<>(
                dailyMatchRepository.findRecentlyRecommendedProfileIds(userId, today, cutoff));

        // Partition into: fresh (never seen OR last seen > 30 days ago)
        //            vs.  stale (seen within last 30 days — temporarily excluded)
        List<Profile> freshCandidates = candidates.stream()
                .filter(p -> !recentlySeen.contains(p.getId()))
                .collect(Collectors.toList());

        List<Profile> batch;
        if (freshCandidates.size() >= DAILY_BATCH_SIZE) {
            // Happy path: enough completely fresh profiles
            batch = freshCandidates.stream()
                    .limit(DAILY_BATCH_SIZE)
                    .collect(Collectors.toList());
        } else {
            // Recycling path: take all fresh candidates, then fill remaining
            // slots from the "stale" pool (seen > 30 days ago, not swiped).
            // The stale pool consists of every eligible candidate that IS in
            // the recently-seen set — i.e., the inverse of freshCandidates.
            // We track IDs already chosen to guarantee no duplicates within
            // the same batch.
            Set<String> chosenIds = new HashSet<>();
            batch = new ArrayList<>(freshCandidates);
            freshCandidates.forEach(p -> chosenIds.add(p.getId()));

            int remaining = DAILY_BATCH_SIZE - batch.size();
            if (remaining > 0) {
                // stale = eligible (not swiped) AND in the recently-seen window
                List<Profile> staleRecyclable = candidates.stream()
                        .filter(p -> recentlySeen.contains(p.getId()))
                        .filter(p -> !chosenIds.contains(p.getId()))
                        .limit(remaining)
                        .collect(Collectors.toList());

                if (!staleRecyclable.isEmpty()) {
                    log.info("Recycling {} profile(s) for user={} on date={} (fresh pool insufficient)",
                            staleRecyclable.size(), userId, today);
                    batch.addAll(staleRecyclable);
                }
            }
        }

        if (batch.isEmpty()) {
            log.info("No eligible profiles available for user={} on date={}", userId, today);
            return Collections.emptyList();
        }

        // ── Persist the batch ─────────────────────────────────────────────────
        try {
            persistBatch(userId, today, batch);
        } catch (DataIntegrityViolationException ex) {
            // A concurrent request already committed the batch; read it back.
            log.warn("Concurrent batch creation detected for user={} date={}, reading committed batch.",
                    userId, today);
            return loadPersistedBatch(userId, today);
        }

        return batch.stream()
            .map(profile -> mapToDto(profile, premiumCandidateIds.contains(profile.getId())))
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
        Set<String> premiumIds = activePriorityIds(userId, ids);

        Map<String, Profile> profileMap = profileRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Profile::getId, p -> p));

        return batch.stream()
                .filter(dm -> !swipedIds.contains(dm.getRecommendedProfileId()))
                .map(dm -> profileMap.get(dm.getRecommendedProfileId()))
                .filter(Objects::nonNull)
                .map(profile -> mapToDto(profile, premiumIds.contains(profile.getId())))
                .collect(Collectors.toList());
    }

    private Set<String> activePriorityProfileIds(String targetUserId, Collection<Profile> profiles) {
        return activePriorityIds(targetUserId,
                profiles.stream().map(Profile::getId).collect(Collectors.toList()));
    }

    private Set<String> activePriorityIds(String targetUserId, Collection<String> profileIds) {
        Set<String> priorityIds = activePremiumIds(profileIds);
        if (!profileIds.isEmpty()) {
            priorityIds.addAll(priorityInterestRepository.findActiveSenderIdsForTarget(
                    targetUserId, profileIds, LocalDateTime.now()));
        }
        return priorityIds;
    }

    private Set<String> activePremiumIds(Collection<String> profileIds) {
        if (profileIds.isEmpty()) return Collections.emptySet();
        return new HashSet<>(userEntitlementRepository.findActivePremiumUserIds(
                new ArrayList<>(profileIds), LocalDateTime.now()));
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
        return mapToDto(profile, false);
    }

    private ProfileDto mapToDto(Profile profile, boolean priorityBadge) {
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
                .priorityBadge(priorityBadge)
                .build();
    }
}
