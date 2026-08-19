package com.eternalbond.api.service;

import com.eternalbond.api.dto.PriorityInterestActivationResponse;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.EntitlementKey;
import com.eternalbond.api.model.PriorityInterest;
import com.eternalbond.api.model.UserEntitlement;
import com.eternalbond.api.repository.PriorityInterestRepository;
import com.eternalbond.api.repository.ProfileRepository;
import com.eternalbond.api.repository.UserEntitlementRepository;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class PriorityInterestService {

    private final UserEntitlementRepository entitlementRepository;
    private final PriorityInterestRepository priorityInterestRepository;
    private final ProfileRepository profileRepository;

    public PriorityInterestService(
            UserEntitlementRepository entitlementRepository,
            PriorityInterestRepository priorityInterestRepository,
            ProfileRepository profileRepository) {
        this.entitlementRepository = entitlementRepository;
        this.priorityInterestRepository = priorityInterestRepository;
        this.profileRepository = profileRepository;
    }

    public PriorityInterestActivationResponse activate(String senderId, String targetProfileId) {
        if (!profileRepository.existsById(targetProfileId)) {
            throw new ResourceNotFoundException("Target profile not found: " + targetProfileId);
        }
        if (senderId.equals(targetProfileId)) {
            throw new IllegalArgumentException("You cannot send Priority Interest to yourself.");
        }
        if (priorityInterestRepository.existsBySenderIdAndTargetId(senderId, targetProfileId)) {
            throw new IllegalArgumentException("Priority Interest was already sent to this profile.");
        }

        LocalDateTime now = LocalDateTime.now();
        UserEntitlement entitlement = entitlementRepository
                .findFirstUnconsumedForUpdate(senderId, EntitlementKey.priority_interest, now)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No Priority Interest entitlement is available."));

        if (priorityInterestRepository.existsByEntitlementId(entitlement.getId())) {
            throw new IllegalArgumentException("Priority Interest entitlement was already activated.");
        }

        LocalDateTime expiresAt = now.plusHours(24);
        try {
            priorityInterestRepository.save(PriorityInterest.builder()
                    .entitlementId(entitlement.getId())
                    .senderId(senderId)
                    .targetId(targetProfileId)
                    .createdAt(now)
                    .expiresAt(expiresAt)
                    .build());
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Priority Interest was already sent to this profile.", ex);
        }

        entitlement.setConsumed(true);
        entitlementRepository.saveAndFlush(entitlement);

        return PriorityInterestActivationResponse.builder()
                .targetProfileId(targetProfileId)
                .expiresAt(expiresAt)
                .priorityInterestsRemaining((int) entitlementRepository.countAvailableEntitlements(
                    senderId, EntitlementKey.priority_interest, now))
                .build();
    }
}
