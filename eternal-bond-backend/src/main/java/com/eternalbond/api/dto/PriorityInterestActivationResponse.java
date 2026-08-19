package com.eternalbond.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriorityInterestActivationResponse {

    private String targetProfileId;
    private LocalDateTime expiresAt;
    private int priorityInterestsRemaining;
}
