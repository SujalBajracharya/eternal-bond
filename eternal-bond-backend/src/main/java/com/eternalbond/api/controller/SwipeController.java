package com.eternalbond.api.controller;

import com.eternalbond.api.dto.SwipeRequest;
import com.eternalbond.api.service.SwipeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/swipes")
public class SwipeController {

    private final SwipeService swipeService;

    public SwipeController(SwipeService swipeService) {
        this.swipeService = swipeService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> swipe(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody SwipeRequest request
    ) {
        boolean isMatch = swipeService.registerSwipe(userId, request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "isMatch", isMatch,
                "message", isMatch ? "Mutual match created!" : "Swipe registered."
        ));
    }

    @org.springframework.web.bind.annotation.GetMapping("/admirers")
    public ResponseEntity<java.util.List<com.eternalbond.api.dto.ProfileDto>> getAdmirers(
            @AuthenticationPrincipal String userId
    ) {
        return ResponseEntity.ok(swipeService.getAdmirers(userId));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{swipedId}")
    public ResponseEntity<Map<String, Object>> undoSwipe(
            @AuthenticationPrincipal String userId,
            @org.springframework.web.bind.annotation.PathVariable String swipedId
    ) {
        swipeService.deleteSwipe(userId, swipedId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Swipe removed."));
    }
}
