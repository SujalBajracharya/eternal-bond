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
public class ProfileBoostGrantResponse {

    private String grantType;
    private String grantPeriod;
    private boolean available;
    private boolean active;
    private LocalDateTime expiresAt;
}
