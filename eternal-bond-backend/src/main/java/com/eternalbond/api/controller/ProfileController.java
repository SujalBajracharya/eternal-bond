package com.eternalbond.api.controller;

import com.eternalbond.api.dto.ProfileDto;
import com.eternalbond.api.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileDto> getMyProfile(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<ProfileDto> updateMyProfile(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ProfileDto dto
    ) {
        return ResponseEntity.ok(profileService.updateProfile(userId, dto));
    }

    @GetMapping("/daily")
    public ResponseEntity<List<ProfileDto>> getDailyRecommendations(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(profileService.getDailyMatches(userId));
    }

    /**
     * Searches the full eligible candidate pool with the user's saved preferences.
     * Returns up to 5 matching profiles.
     * <p>
     * This endpoint NEVER reads or writes the daily_match table. The user's daily
     * batch of 5 profiles is completely unaffected.
     */
    @GetMapping("/search")
    public ResponseEntity<List<ProfileDto>> getFilteredMatches(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(profileService.getFilteredMatches(userId));
    }
}
