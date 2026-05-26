package com.eternalbond.api.controller;

import com.eternalbond.api.dto.SubscriptionRequest;
import com.eternalbond.api.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/activate")
    public ResponseEntity<Map<String, Object>> activate(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody SubscriptionRequest request
    ) {
        subscriptionService.activateSubscription(userId, request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Subscription activated successfully!"
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> checkStatus(@AuthenticationPrincipal String userId) {
        String tier = subscriptionService.checkSubscriptionTier(userId);
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "tier", tier
        ));
    }
}
