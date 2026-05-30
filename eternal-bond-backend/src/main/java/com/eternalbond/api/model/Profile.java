package com.eternalbond.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "profiles", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    @Id
    private String id; // Matches the Supabase Auth User UUID (String format)

    @Column(name = "full_name")
    private String fullName;

    @Enumerated(EnumType.STRING)
    private GenderType gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    private String location;

    private String bio;

    private String profession;

    private String religion;

    @Column(name = "mother_tongue")
    private String motherTongue;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Enumerated(EnumType.STRING)
    @Column(name = "marital_status")
    private MaritalStatusType maritalStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "looking_for")
    private GenderType lookingFor;

    @Column(name = "avatar_url")
    private String avatarUrl;

    private String phone;

    private String email;

    @Column(name = "profile_completed", nullable = false)
    private boolean profileCompleted = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "highest_education")
    private EducationLevel highestEducation;

    @Column(name = "income_range")
    private IncomeRange incomeRange;

    @Column(name = "father_occupation")
    private String fatherOccupation;

    @Column(name = "mother_occupation")
    private String motherOccupation;

    private String siblings;

    @Enumerated(EnumType.STRING)
    @Column(name = "family_type")
    private FamilyType familyType;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "profile_photos_mapping", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "photo_url")
    private List<String> photos;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "social_links", columnDefinition = "jsonb")
    private String socialLinks; // JSON serialized string mapping social media links

    @Column(name = "kundali_name")
    private String kundaliName;

    @Column(name = "kundali_url")
    private String kundaliUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false)
    private KycStatus kycStatus = KycStatus.unverified;

    @Enumerated(EnumType.STRING)
    @Column(name = "photo_visibility", nullable = false)
    private PrivacyLevel photoVisibility = PrivacyLevel.everyone;

    @Enumerated(EnumType.STRING)
    @Column(name = "profile_visibility", nullable = false)
    private PrivacyLevel profileVisibility = PrivacyLevel.everyone;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Inner Enums
    public enum GenderType { male, female, other }
    public enum MaritalStatusType { never_married, divorced, widowed, separated }
    public enum EducationLevel { high_school, diploma, bachelors, masters, doctorates, other }
    public enum IncomeRange {
        UNDER_5L("under_5l"),
        RANGE_5L_10L("5l_10l"),
        RANGE_10L_20L("10l_20l"),
        RANGE_20L_50L("20l_50l"),
        RANGE_50L_1CR("50l_1cr"),
        ABOVE_1CR("above_1cr"),
        PREFER_NOT_TO_SAY("prefer_not_to_say");

        private final String value;

        IncomeRange(String value) {
            this.value = value;
        }

        @JsonValue
        public String getValue() {
            return value;
        }

        @JsonCreator
        public static IncomeRange fromValue(String text) {
            for (IncomeRange b : IncomeRange.values()) {
                if (b.value.equalsIgnoreCase(text)) {
                    return b;
                }
            }
            return PREFER_NOT_TO_SAY;
        }
    }

    @Converter(autoApply = true)
    public static class IncomeRangeConverter implements AttributeConverter<IncomeRange, String> {
        @Override
        public String convertToDatabaseColumn(IncomeRange attribute) {
            if (attribute == null) {
                return null;
            }
            return attribute.getValue();
        }

        @Override
        public IncomeRange convertToEntityAttribute(String dbData) {
            if (dbData == null) {
                return null;
            }
            return IncomeRange.fromValue(dbData);
        }
    }
    public enum FamilyType { joint, nuclear, other }
    public enum KycStatus { unverified, pending, verified, rejected }
    public enum PrivacyLevel { everyone, verified_only, matches_only, premium_only }
}
