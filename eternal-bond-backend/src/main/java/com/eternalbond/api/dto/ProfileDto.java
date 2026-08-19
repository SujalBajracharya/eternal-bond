package com.eternalbond.api.dto;

import com.eternalbond.api.model.Profile;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileDto {

    private String id;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotNull(message = "Gender is required")
    private Profile.GenderType gender;

    @NotNull(message = "Date of birth is required")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Location is required")
    private String location;

    private String bio;

    @NotBlank(message = "Profession is required")
    private String profession;

    @NotBlank(message = "Religion is required")
    private String religion;

    @NotBlank(message = "Mother tongue is required")
    private String motherTongue;

    @NotNull(message = "Height is required")
    private Integer heightCm;

    @NotNull(message = "Marital status is required")
    private Profile.MaritalStatusType maritalStatus;

    @NotNull(message = "Preference gender looking for is required")
    private Profile.GenderType lookingFor;

    private String avatarUrl;

    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    private boolean profileCompleted;

    private Profile.EducationLevel highestEducation;

    private Profile.IncomeRange incomeRange;

    private String fatherOccupation;

    private String motherOccupation;

    private String siblings;

    private Profile.FamilyType familyType;

    private List<String> photos;

    private String socialLinks;

    private String kundaliName;

    private String kundaliUrl;

    private String citizenshipFrontUrl;

    private String citizenshipBackUrl;

    private Profile.KycStatus kycStatus;

    private Profile.PrivacyLevel photoVisibility;

    private Profile.PrivacyLevel profileVisibility;

    private String marriageIntention;

    private Boolean openToRelocate;

    /** True when this profile has an active Premium priority-interest badge. */
    private boolean priorityBadge;
}
