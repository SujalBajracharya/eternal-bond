package com.eternalbond.api.service;

import com.eternalbond.api.model.UserNotification;
import com.eternalbond.api.repository.UserNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UserNotificationService {

    private final UserNotificationRepository repository;

    public UserNotificationService(UserNotificationRepository repository) {
        this.repository = repository;
    }

    public List<UserNotification> getNotificationsForUser(String userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public UserNotification getNotification(UUID id, String userId) {
        UserNotification notification = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to access this notification");
        }
        return notification;
    }

    public void markAsRead(UUID id, String userId) {
        UserNotification notification = getNotification(id, userId);
        notification.setRead(true);
        repository.save(notification);
    }
}
