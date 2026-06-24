package com.eternalbond.api.service;

import com.eternalbond.api.dto.ProfileDto;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
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

        return recommendations.stream()
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
                .build();
    }
}
