package com.eternalbond.api.service;

import com.eternalbond.api.dto.ProfileDto;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.model.ProfilePreferences;
import com.eternalbond.api.repository.ProfilePreferencesRepository;
import com.eternalbond.api.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
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
        // Return the same object that was passed to save (to capture mutations)
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
    // getDailyMatches()
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
    @DisplayName("getDailyMatches - returns up to 5 candidates when no preferences are active")
    void getDailyMatches_noPreferences_returnsUpToFive() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));
        when(profilePreferencesRepository.findByProfileIdAndIsActiveTrue("uid-001"))
                .thenReturn(Optional.empty());

        List<Profile> candidates = IntStream.range(0, 8)
                .mapToObj(i -> Profile.builder().id("cand-" + i).fullName("Candidate " + i).build())
                .toList();
        when(profileRepository.findDailyMatchesForUser("uid-001", Profile.GenderType.female))
                .thenReturn(candidates);

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        assertThat(results).hasSize(5);
    }

    @Test
    @DisplayName("getDailyMatches - applies age min/max filter from active preferences")
    void getDailyMatches_withAgePreference_filtersOutOfRangeProfiles() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));

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

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo("p-in");
    }

    @Test
    @DisplayName("getDailyMatches - applies religion filter from active preferences")
    void getDailyMatches_withReligionPreference_filtersNonMatchingReligion() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));

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

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo("p-hindu");
    }

    @Test
    @DisplayName("getDailyMatches - 'No preference' religion pref returns all")
    void getDailyMatches_noPreferenceReligion_returnsAll() {
        when(profileRepository.findById("uid-001")).thenReturn(Optional.of(testProfile));

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

        List<ProfileDto> results = profileService.getDailyMatches("uid-001");

        // Both should pass the religion filter
        assertThat(results).hasSize(2);
    }
}
