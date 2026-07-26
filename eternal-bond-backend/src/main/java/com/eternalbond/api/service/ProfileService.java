package com.eternalbond.api.service;

import com.eternalbond.api.dto.ProfileDto;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.model.ProfilePreferences;
import com.eternalbond.api.repository.ProfileRepository;
import com.eternalbond.api.repository.ProfilePreferencesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final ProfilePreferencesRepository profilePreferencesRepository;

    public ProfileService(ProfileRepository profileRepository,
            ProfilePreferencesRepository profilePreferencesRepository) {
        this.profileRepository = profileRepository;
        this.profilePreferencesRepository = profilePreferencesRepository;
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

    @Transactional(readOnly = true)
    public List<ProfileDto> getDailyMatches(String userId) {
        Profile userProfile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Active profile not found"));

        List<Profile> recommendations = profileRepository.findDailyMatchesForUser(
                userId, userProfile.getLookingFor());

        // Fetch user's active preferences
        ProfilePreferences pref = profilePreferencesRepository.findByProfileIdAndIsActiveTrue(userId).orElse(null);

        if (pref != null) {
            recommendations = recommendations.stream().filter(p -> {
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

        return recommendations.stream().limit(5)
                .map(this::mapToDto)
                .collect(Collectors.toList());
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
