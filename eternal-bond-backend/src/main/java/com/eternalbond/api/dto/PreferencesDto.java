package com.eternalbond.api.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreferencesDto {
    private String presetName;
    private Boolean isActive;
    private Integer prefAgeMin;
    private Integer prefAgeMax;
    private Integer prefHeightMin;
    private Integer prefHeightMax;
    private String prefLocation;
    private String prefRelocate;
    private String prefEducation;
    private String prefProfession;
    private String prefReligion;
    private String prefIntention;
    private Boolean prefVerifiedOnly;
    private Boolean prefFamilyAssisted;
}
