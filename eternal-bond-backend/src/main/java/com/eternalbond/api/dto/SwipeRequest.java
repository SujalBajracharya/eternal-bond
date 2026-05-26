package com.eternalbond.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SwipeRequest {

    @NotBlank(message = "Profile ID is required")
    private String profileId;

    @NotBlank(message = "Action is required")
    @Pattern(regexp = "like|dislike", message = "Action must be either 'like' or 'dislike'")
    private String action;
}
