package com.eternalbond.api.astrology.profile;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/astrology/profile")
public class ProfileKundaliController {

    private final ProfileKundaliService service;

    public ProfileKundaliController(ProfileKundaliService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<KundaliProfileResponse> createProfile(
            @AuthenticationPrincipal String profileId,
            @Valid @RequestBody CreateKundaliProfileRequest request
    ) {
        KundaliProfileResponse response = service.createProfile(profileId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<KundaliProfileResponse> getProfile(
            @AuthenticationPrincipal String profileId
    ) {
        KundaliProfileResponse response = service.getProfile(profileId);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<KundaliProfileResponse> updateProfile(
            @AuthenticationPrincipal String profileId,
            @Valid @RequestBody UpdateKundaliProfileRequest request
    ) {
        KundaliProfileResponse response = service.updateProfile(profileId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteProfile(
            @AuthenticationPrincipal String profileId
    ) {
        service.deleteProfile(profileId);
        return ResponseEntity.noContent().build();
    }
}
