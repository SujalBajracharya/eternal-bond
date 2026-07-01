package com.eternalbond.api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "profile_preferences", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfilePreferences {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "profile_id", nullable = false)
    private String profileId;

    @Column(name = "preset_name", nullable = false)
    private String presetName;

    @Column(name = "is_active")
    private Boolean isActive = false;

    @Column(name = "pref_age_min")
    private Integer prefAgeMin = 21;

    @Column(name = "pref_age_max")
    private Integer prefAgeMax = 50;

    @Column(name = "pref_height_min")
    private Integer prefHeightMin = 140;

    @Column(name = "pref_height_max")
    private Integer prefHeightMax = 200;

    @Column(name = "pref_location")
    private String prefLocation = "";

    @Column(name = "pref_relocate")
    private String prefRelocate = "any";

    @Column(name = "pref_education")
    private String prefEducation = "";

    @Column(name = "pref_profession")
    private String prefProfession = "";

    @Column(name = "pref_religion")
    private String prefReligion = "No preference";

    @Column(name = "pref_intention")
    private String prefIntention = "When right";

    @Column(name = "pref_verified_only")
    private Boolean prefVerifiedOnly = false;

    @Column(name = "pref_family_assisted")
    private Boolean prefFamilyAssisted = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
