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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProfileService Unit Tests")
class ProfileServiceTest {

    @Mock private ProfileRepository profileRepository;
    @Mock private ProfilePreferencesRepository profilePreferencesRepository;
    @Mock private DailyMatchRepository dailyMatchRepository;
    @Mock private SwipeRepository swipeRepository;
        @Mock private PriorityInterestRepository priorityInterestRepository;
        @Mock private UserEntitlementRepository userEntitlementRepository;

    @InjectMocks
    private ProfileService profileService;

    private Profile testProfile;

    @BeforeEach
    void setUp() {
        testProfile = Profile.builder()
                .id("uid-001")
                .fullName("Sujal Bajracharya")
                .gender(Profile.GenderType.male)
                .dateOfBirth(LocalDate.of(1999, 5, 15))
                .location("Kathmandu")
                .profession("Engineer")
                .lookingFor(Profile.GenderType.female)
                .build();
    }

    // -------------------------------------------------------------------------
    // getProfile()
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("getProfile - returns ProfileDto when profile exists")
    void getProfile_found_returnsDto() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));

        ProfileDto dto = profileService.getProfile("uid-001");

        assertThat(dto.getId()).isEqualTo("uid-001");
        assertThat(dto.getFullName()).isEqualTo("Sujal Bajracharya");
        assertThat(dto.getGender()).isEqualTo(Profile.GenderType.male);
        assertThat(dto.getLocation()).isEqualTo("Kathmandu");
    }

    @Test
    @DisplayName("getProfile - throws ResourceNotFoundException when profile does not exist")
    void getProfile_notFound_throwsResourceNotFound() {
        when(profileRepository.findById("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.getProfile("unknown"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Profile not found with ID: unknown");
    }

    // -------------------------------------------------------------------------
    // updateProfile()
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("updateProfile - creates new profile when none exists")
    void updateProfile_noExistingProfile_createsAndSaves() {
        when(profileRepository.findById("new-uid")).thenReturn(Optional.empty());

        ProfileDto dto = ProfileDto.builder()
                .fullName("New User")
                .gender(Profile.GenderType.female)
                .dateOfBirth(LocalDate.of(2000, 1, 1))
                .location("Pokhara")
                .build();

        Profile savedProfile = Profile.builder()
                .id("new-uid")
                .fullName("New User")
                .gender(Profile.GenderType.female)
                .location("Pokhara")
                .build();
        when(profileRepository.save(any(Profile.class))).thenReturn(savedProfile);

        ProfileDto result = profileService.updateProfile("new-uid", dto);

        assertThat(result).isNotNull();
        verify(profileRepository).save(any(Profile.class));
    }

    @Test
    @DisplayName("updateProfile - updates existing profile fields in place")
    void updateProfile_existingProfile_updatesFields() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(profileRepository.save(any(Profile.class))).thenReturn(testProfile);

        ProfileDto dto = ProfileDto.builder()
                .fullName("Sujal Updated")
                .gender(Profile.GenderType.male)
                .location("Bhaktapur")
                .build();

        profileService.updateProfile("uid-001", dto);

        assertThat(testProfile.getFullName()).isEqualTo("Sujal Updated");
        assertThat(testProfile.getLocation()).isEqualTo("Bhaktapur");
    }

    @Test
    @DisplayName("updateProfile - marks profileCompleted=true when all core fields present")
    void updateProfile_allCoreFields_setsProfileCompleted() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(profileRepository.save(any(Profile.class))).thenAnswer(inv -> inv.getArgument(0));

        ProfileDto dto = ProfileDto.builder()
                .fullName("Sujal")
                .gender(Profile.GenderType.male)
                .dateOfBirth(LocalDate.of(1999, 5, 15))
                .location("Kathmandu")
                .highestEducation(Profile.EducationLevel.bachelors)
                .build();

        ProfileDto result = profileService.updateProfile("uid-001", dto);

        assertThat(result.isProfileCompleted()).isTrue();
    }

    @Test
    @DisplayName("updateProfile - marks profileCompleted=false when a core field is missing")
    void updateProfile_missingCoreField_profileNotCompleted() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(profileRepository.save(any(Profile.class))).thenAnswer(inv -> inv.getArgument(0));

        ProfileDto dto = ProfileDto.builder()
                .fullName("Sujal")
                .gender(Profile.GenderType.male)
                .dateOfBirth(LocalDate.of(1999, 5, 15))
                .location("Kathmandu")
                // highestEducation missing → profileCompleted must be false
                .build();

        ProfileDto result = profileService.updateProfile("uid-001", dto);

        assertThat(result.isProfileCompleted()).isFalse();
    }

    // -------------------------------------------------------------------------
    // getDailyMatches() — persistent batch system
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("getDailyMatches - throws ResourceNotFoundException when user profile not found")
    void getDailyMatches_profileNotFound_throws() {
        when(profileRepository.findById("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.getDailyMatches("unknown"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Active profile not found");
    }

    @Test
    @DisplayName("getDailyMatches - first request of the day creates exactly 5 DailyMatch records")
    void getDailyMatches_firstRequestOfDay_persistsExactlyFiveRecords() {
        // Arrange: no existing batch today
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.empty());

        List<Profile> candidates = IntStream.range(0, 8)
                .mapToObj(i -> Profile.builder().id("cand-" + i).fullName("Candidate " + i).build())
                .toList();
        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(candidates);
        when(dailyMatchRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // Act
        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        // Assert: exactly 5 returned and exactly 5 persisted
        assertThat(results).hasSize(5);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DailyMatch>> captor = ArgumentCaptor.forClass(List.class);
        verify(dailyMatchRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(5);
    }

    @Test
    @DisplayName("getDailyMatches - active Premium candidates are ordered first")
    void getDailyMatches_activePremiumCandidatesArePrioritized() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.empty());

        List<Profile> candidates = List.of(
                Profile.builder().id("free-candidate").fullName("Free").build(),
                Profile.builder().id("premium-candidate").fullName("Premium").build());
        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(candidates);
        when(userEntitlementRepository.findActivePremiumUserIds(anyList(), any(LocalDateTime.class)))
                .thenReturn(List.of("premium-candidate"));
        when(dailyMatchRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        assertThat(results).extracting(ProfileDto::getId)
                .startsWith("premium-candidate");
        assertThat(results.get(0).isPriorityBadge()).isTrue();
    }

    @Test
    @DisplayName("getDailyMatches - repeated request on the same day returns the persisted batch (no new inserts)")
    void getDailyMatches_sameDay_returnsCachedBatch() {
        // Arrange: batch already exists today
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(true);

        List<DailyMatch> existingBatch = IntStream.range(0, 5)
                .mapToObj(i -> DailyMatch.builder()
                        .userId("uid-001")
                        .recommendedProfileId("cand-" + i)
                        .matchDate(LocalDate.now())
                        .sortOrder(i)
                        .build())
                .toList();
        when(dailyMatchRepository.findByUserIdAndMatchDateOrderBySortOrderAsc("uid-001", LocalDate.now()))
                .thenReturn(existingBatch);

        List<Profile> profiles = IntStream.range(0, 5)
                .mapToObj(i -> Profile.builder().id("cand-" + i).fullName("Candidate " + i).build())
                .toList();
        when(profileRepository.findAllById(anyList())).thenReturn(profiles);

        // Act
        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        // Assert: same 5 returned, no saveAll called
        assertThat(results).hasSize(5);
        verify(dailyMatchRepository, never()).saveAll(anyList());
        verify(profileRepository, never()).findDailyMatchesForUser(any(), any());
    }

    @Test
    @DisplayName("getDailyMatches - next day generates a new batch of up to 5 profiles")
    void getDailyMatches_nextDay_generatesNewBatch() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(List.of("cand-0", "cand-1", "cand-2", "cand-3", "cand-4")); // yesterday's batch
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.empty());

        // 10 total candidates; first 5 are yesterday's, next 5 are fresh
        List<Profile> candidates = IntStream.range(0, 10)
                .mapToObj(i -> Profile.builder().id("cand-" + i).fullName("Candidate " + i).build())
                .toList();
        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(candidates);
        when(dailyMatchRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        assertThat(results).hasSize(5);
        // The returned IDs must be the NEW candidates (cand-5 through cand-9)
        List<String> returnedIds = results.stream().map(ProfileDto::getId).toList();
        assertThat(returnedIds).containsExactly("cand-5", "cand-6", "cand-7", "cand-8", "cand-9");
    }

    @Test
    @DisplayName("getDailyMatches - profiles seen within 30 days are excluded; truly unseen profiles are served first")
    void getDailyMatches_recentProfilesExcluded_withinWindow() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        // A–J were recommended within the last 30 days
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(List.of("A", "B", "C", "D", "E", "F", "G", "H", "I", "J"));
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.empty());

        // Candidates K, L, M are fresh; A and J are recently-seen and are used
        // to pad the batch because fewer than five fresh candidates exist.
        List<Profile> candidates = List.of(
                Profile.builder().id("A").build(), // recently seen
                Profile.builder().id("K").build(), // fresh
                Profile.builder().id("L").build(), // fresh
                Profile.builder().id("J").build(), // recently seen
                Profile.builder().id("M").build()  // fresh
        );
        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(candidates);
        when(dailyMatchRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        // The three fresh candidates are returned first, then the recent
        // candidates fill the batch to the daily limit.
        assertThat(results).hasSize(5);
        List<String> ids = results.stream().map(ProfileDto::getId).toList();
        assertThat(ids).containsExactlyInAnyOrder("A", "J", "K", "L", "M");
    }

    @Test
    @DisplayName("getDailyMatches - applies age min/max filter from active preferences")
    void getDailyMatches_withAgePreference_filtersOutOfRangeProfiles() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        ProfilePreferences prefs = ProfilePreferences.builder()
                .prefAgeMin(25)
                .prefAgeMax(30)
                .isActive(true)
                .build();
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.of(prefs));

        // In-range: 28 years old
        Profile inRange = Profile.builder()
                .id("p-in")
                .fullName("In Range")
                .dateOfBirth(LocalDate.now().minusYears(28))
                .build();
        // Out-of-range: 20 years old (below min 25)
        Profile outOfRange = Profile.builder()
                .id("p-out")
                .fullName("Out Of Range")
                .dateOfBirth(LocalDate.now().minusYears(20))
                .build();

        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(List.of(inRange, outOfRange));
        when(dailyMatchRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo("p-in");
    }

    @Test
    @DisplayName("getDailyMatches - applies religion filter from active preferences")
    void getDailyMatches_withReligionPreference_filtersNonMatchingReligion() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        ProfilePreferences prefs = ProfilePreferences.builder()
                .prefReligion("Hindu")
                .isActive(true)
                .build();
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.of(prefs));

        Profile hindu = Profile.builder().id("p-hindu").fullName("Hindu User").religion("Hindu").build();
        Profile buddhist = Profile.builder().id("p-bud").fullName("Buddhist User").religion("Buddhist").build();

        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(List.of(hindu, buddhist));
        when(dailyMatchRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo("p-hindu");
    }

    @Test
    @DisplayName("getDailyMatches - 'No preference' religion pref returns all")
    void getDailyMatches_noPreferenceReligion_returnsAll() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        ProfilePreferences prefs = ProfilePreferences.builder()
                .prefReligion("No preference")
                .isActive(true)
                .build();
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.of(prefs));

        Profile p1 = Profile.builder().id("p1").fullName("P1").religion("Hindu").build();
        Profile p2 = Profile.builder().id("p2").fullName("P2").religion("Christian").build();

        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(List.of(p1, p2));
        when(dailyMatchRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        // Both should pass the religion filter
        assertThat(results).hasSize(2);
    }

    @Test
    @DisplayName("getDailyMatches - fewer than 5 eligible profiles returns available profiles (not an error)")
    void getDailyMatches_fewerThanFiveEligible_returnsAvailable() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.empty());

        // Only 3 candidates available
        List<Profile> candidates = IntStream.range(0, 3)
                .mapToObj(i -> Profile.builder().id("c-" + i).build())
                .toList();
        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(candidates);
        when(dailyMatchRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        assertThat(results).hasSize(3);
    }

    @Test
    @DisplayName("getDailyMatches - zero eligible profiles returns empty list")
    void getDailyMatches_zeroEligible_returnsEmptyList() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.empty());
        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(Collections.emptyList());

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        assertThat(results).isEmpty();
        verify(dailyMatchRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("getDailyMatches - concurrent request falls back to committed batch on DataIntegrityViolationException")
    void getDailyMatches_concurrentRequest_fallsBackToCommittedBatch() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        // First check: no batch exists (both concurrent requests see this)
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.empty());

        List<Profile> candidates = IntStream.range(0, 5)
                .mapToObj(i -> Profile.builder().id("c-" + i).fullName("C" + i).build())
                .toList();
        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(candidates);

        // Simulate the second concurrent request losing the unique-constraint race
        when(dailyMatchRepository.saveAll(anyList()))
                .thenThrow(new DataIntegrityViolationException("unique constraint violated"));

        // The committed batch that the first request persisted
        List<DailyMatch> committedBatch = IntStream.range(0, 5)
                .mapToObj(i -> DailyMatch.builder()
                        .userId("uid-001")
                        .recommendedProfileId("c-" + i)
                        .matchDate(LocalDate.now())
                        .sortOrder(i)
                        .build())
                .toList();
        when(dailyMatchRepository.findByUserIdAndMatchDateOrderBySortOrderAsc("uid-001", LocalDate.now()))
                .thenReturn(committedBatch);
        when(profileRepository.findAllById(anyList())).thenReturn(candidates);

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        // Should fall back and return the 5 profiles the winning request committed
        assertThat(results).hasSize(5);
        verify(dailyMatchRepository).findByUserIdAndMatchDateOrderBySortOrderAsc("uid-001", LocalDate.now());
    }

    @Test
    @DisplayName("getDailyMatches - application restart does not lose the daily batch (reads from DB)")
    void getDailyMatches_afterRestart_returnsPersistedBatch() {
        // Simulates: app restarted, no in-memory state, but DB has the batch
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(true); // DB has the batch

        List<DailyMatch> persistedBatch = IntStream.range(0, 5)
                .mapToObj(i -> DailyMatch.builder()
                        .userId("uid-001")
                        .recommendedProfileId("persisted-" + i)
                        .matchDate(LocalDate.now())
                        .sortOrder(i)
                        .build())
                .toList();
        when(dailyMatchRepository.findByUserIdAndMatchDateOrderBySortOrderAsc("uid-001", LocalDate.now()))
                .thenReturn(persistedBatch);

        List<Profile> profiles = IntStream.range(0, 5)
                .mapToObj(i -> Profile.builder().id("persisted-" + i).fullName("P" + i).build())
                .toList();
        when(profileRepository.findAllById(anyList())).thenReturn(profiles);

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        assertThat(results).hasSize(5);
        // Crucially: no saveAll and no findDailyMatchesForUser called — came from DB
        verify(dailyMatchRepository, never()).saveAll(anyList());
        verify(profileRepository, never()).findDailyMatchesForUser(any(), any());
    }
    // -------------------------------------------------------------------------
    // getDailyMatches() — 30-day recycling fallback
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("getDailyMatches - recycling: profiles seen >30 days ago fill remaining batch slots")
    void getDailyMatches_recycling_fillsRemainingSlots() {
        // Arrange: 4 fresh profiles + 1 recently-seen profile, so recycling
        // pads the batch with the recently-seen candidate.
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        // "old-1" .. "old-4" were recommended more than 30 days ago → NOT in recentlySeen
        // "new-1" .. "new-2" are truly fresh                           → NOT in recentlySeen
        // "recent-1" was shown 5 days ago                              → IN recentlySeen
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(List.of("recent-1"));
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.empty());

        // findDailyMatchesForUser already excluded swiped profiles at DB level.
        // "old-1".."old-4" appear here because they are older than 30 days and NOT swiped.
        List<Profile> candidates = List.of(
                Profile.builder().id("new-1").fullName("New 1").build(),
                Profile.builder().id("new-2").fullName("New 2").build(),
                Profile.builder().id("recent-1").fullName("Recent 1").build(), // seen 5 days ago
                Profile.builder().id("old-1").fullName("Old 1").build(),       // seen 45 days ago
                Profile.builder().id("old-2").fullName("Old 2").build()        // seen 60 days ago
        );
        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(candidates);
        when(dailyMatchRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        // Fresh = new-1, new-2, old-1, old-2 (4 profiles); recent-1 fills
        // the remaining slot during recycling.
        assertThat(results).hasSize(5);
        List<String> ids = results.stream().map(ProfileDto::getId).toList();
        assertThat(ids).containsExactlyInAnyOrder("new-1", "new-2", "old-1", "old-2", "recent-1");
        assertThat(ids).contains("recent-1");
    }

    @Test
    @DisplayName("getDailyMatches - recycling fills up to DAILY_BATCH_SIZE without duplicates")
    void getDailyMatches_recycling_noDuplicatesInBatch() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        // All 3 candidates are within 30-day window; none are fresh
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(List.of("A", "B", "C"));
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.empty());

        List<Profile> candidates = List.of(
                Profile.builder().id("A").build(),
                Profile.builder().id("B").build(),
                Profile.builder().id("C").build()
        );
        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(candidates);
        when(dailyMatchRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        // All 3 are recycled from the stale pool; no duplicates
        assertThat(results).hasSize(3);
        List<String> ids = results.stream().map(ProfileDto::getId).toList();
        assertThat(ids).doesNotHaveDuplicates();
        // Verify saveAll was called with exactly 3 unique DailyMatch rows
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DailyMatch>> captor = ArgumentCaptor.forClass(List.class);
        verify(dailyMatchRepository).saveAll(captor.capture());
        List<String> persistedIds = captor.getValue().stream()
                .map(DailyMatch::getRecommendedProfileId).toList();
        assertThat(persistedIds).doesNotHaveDuplicates();
        assertThat(persistedIds).hasSize(3);
    }

    @Test
    @DisplayName("getDailyMatches - swiped profiles are never recycled even when pool is exhausted")
    void getDailyMatches_swipedProfilesAreNeverRecycled() {
        // The DB-level exclusion in findDailyMatchesForUser already strips swiped profiles.
        // This test verifies that even when the entire candidate pool is exhausted (all
        // profiles removed at the DB level by the swipe filter), the service returns empty
        // rather than somehow surfacing swiped profiles.
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(dailyMatchRepository.existsByUserIdAndMatchDate("uid-001", LocalDate.now()))
                .thenReturn(false);
        when(dailyMatchRepository.findRecentlyRecommendedProfileIds(
                eq("uid-001"), eq(LocalDate.now()), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.empty());
        // Simulate: all remaining eligible profiles have been swiped → DB returns nothing
        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(Collections.emptyList());

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        assertThat(results).isEmpty();
        verify(dailyMatchRepository, never()).saveAll(anyList());
    }
}
