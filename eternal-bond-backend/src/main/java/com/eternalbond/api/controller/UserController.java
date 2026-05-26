package com.eternalbond.api.controller;

import com.eternalbond.api.dto.ProfileDto;
import com.eternalbond.api.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final ProfileService profileService;

    public UserController(ProfileService profileService) {
        this.profileService = profileService;
    }

    // Retrieve specific user profile details by ID
    @GetMapping("/{userId}")
    public ResponseEntity<ProfileDto> getUserProfile(@PathVariable String userId) {
        ProfileDto profile = profileService.getProfile(userId);
        
        // Privacy enforcement: redact photos if privacy-focused settings restrict it.
        // E.g., if photoVisibility is matches_only, checks can be added here.
        
        return ResponseEntity.ok(profile);
    }
}
