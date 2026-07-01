package com.eternalbond.api.controller;

import com.eternalbond.api.dto.PreferencesDto;
import com.eternalbond.api.service.PreferencesService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferences")
public class PreferencesController {

    private final PreferencesService preferencesService;

    public PreferencesController(PreferencesService preferencesService) {
        this.preferencesService = preferencesService;
    }

    @GetMapping
    public ResponseEntity<PreferencesDto> getPreferences(@AuthenticationPrincipal String userId) {
        PreferencesDto prefs = preferencesService.getActivePreferences(userId);
        if (prefs == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(prefs);
    }

    @PostMapping
    public ResponseEntity<PreferencesDto> savePreferences(
            @AuthenticationPrincipal String userId,
            @RequestBody PreferencesDto dto
    ) {
        return ResponseEntity.ok(preferencesService.savePreferences(userId, dto));
    }
}
