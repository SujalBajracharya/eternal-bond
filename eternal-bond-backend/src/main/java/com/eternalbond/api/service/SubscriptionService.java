package com.eternalbond.api.service;

import com.eternalbond.api.dto.SubscriptionRequest;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.model.Subscription;
import com.eternalbond.api.repository.ProfileRepository;
import com.eternalbond.api.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final ProfileRepository profileRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository, ProfileRepository profileRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public void activateSubscription(String userId, SubscriptionRequest request) {
        Profile user = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        Subscription subscription = subscriptionRepository
                .findFirstByUserIdAndStatusOrderByExpiresAtDesc(userId, "active")
                .orElseGet(() -> Subscription.builder().user(user).build());

        subscription.setStripeSubscriptionId(request.getStripeSubscriptionId());
        subscription.setTier(request.getTier().toLowerCase());
        subscription.setStatus("active");
        // Subscriptions remain active for 30 days by default
        subscription.setExpiresAt(LocalDateTime.now().plusDays(30));
        subscription.setCreatedAt(LocalDateTime.now());

        subscriptionRepository.save(subscription);
    }

    @Transactional(readOnly = true)
    public String checkSubscriptionTier(String userId) {
        return subscriptionRepository
                .findFirstByUserIdAndStatusOrderByExpiresAtDesc(userId, "active")
                .map(Subscription::getTier)
                .orElse("free");
    }
}
