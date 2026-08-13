package com.eternalbond.api.controller;

import com.eternalbond.api.model.UserNotification;
import com.eternalbond.api.service.UserNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class UserNotificationController {

    private final UserNotificationService service;

    public UserNotificationController(UserNotificationService service) {
        this.service = service;
    }

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new RuntimeException("Unauthorized");
        }
        return auth.getPrincipal().toString();
    }

    @GetMapping
    public ResponseEntity<List<UserNotification>> getNotifications() {
        String userId = getAuthenticatedUserId();
        return ResponseEntity.ok(service.getNotificationsForUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserNotification> getNotification(@PathVariable UUID id) {
        String userId = getAuthenticatedUserId();
        return ResponseEntity.ok(service.getNotification(id, userId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        String userId = getAuthenticatedUserId();
        service.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }
}
