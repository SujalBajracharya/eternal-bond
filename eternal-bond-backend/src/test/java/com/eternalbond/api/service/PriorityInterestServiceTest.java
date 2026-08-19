package com.eternalbond.api.service;

import com.eternalbond.api.model.EntitlementKey;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.model.UserEntitlement;
import com.eternalbond.api.repository.PriorityInterestRepository;
import com.eternalbond.api.repository.ProfileRepository;
import com.eternalbond.api.repository.UserEntitlementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PriorityInterestServiceTest {

    @Mock private UserEntitlementRepository entitlementRepository;
    @Mock private PriorityInterestRepository priorityInterestRepository;
    @Mock private ProfileRepository profileRepository;

    @Test
    void activatesOwnedPriorityInterestOnceForTarget() {
        PriorityInterestService service = new PriorityInterestService(
                entitlementRepository, priorityInterestRepository, profileRepository);
        UUID entitlementId = UUID.randomUUID();
        UserEntitlement entitlement = UserEntitlement.builder()
                .id(entitlementId)
                .userId("sender")
                .entitlementKey(EntitlementKey.priority_interest)
                .active(true)
                .consumed(false)
                .build();

        when(profileRepository.existsById("target")).thenReturn(true);
        when(priorityInterestRepository.existsBySenderIdAndTargetId("sender", "target"))
                .thenReturn(false);
        when(entitlementRepository.findFirstUnconsumedForUpdate(
                eq("sender"), eq(EntitlementKey.priority_interest), any(LocalDateTime.class)))
                .thenReturn(Optional.of(entitlement));
        when(priorityInterestRepository.existsByEntitlementId(entitlementId)).thenReturn(false);
        when(entitlementRepository.countAvailableEntitlements(
                eq("sender"), eq(EntitlementKey.priority_interest), any(LocalDateTime.class)))
                .thenReturn(0L);

        var response = service.activate("sender", "target");

        assertThat(response.getTargetProfileId()).isEqualTo("target");
        assertThat(response.getExpiresAt()).isAfter(LocalDateTime.now());
        assertThat(entitlement.isConsumed()).isTrue();
        verify(priorityInterestRepository).save(any());
        verify(entitlementRepository).saveAndFlush(entitlement);
    }

    @Test
    void rejectsPriorityInterestWithoutAvailableEntitlement() {
        PriorityInterestService service = new PriorityInterestService(
                entitlementRepository, priorityInterestRepository, profileRepository);
        when(profileRepository.existsById("target")).thenReturn(true);
        when(priorityInterestRepository.existsBySenderIdAndTargetId("sender", "target"))
                .thenReturn(false);
        when(entitlementRepository.findFirstUnconsumedForUpdate(
                eq("sender"), eq(EntitlementKey.priority_interest), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.activate("sender", "target"))
                .isInstanceOf(com.eternalbond.api.exception.ResourceNotFoundException.class)
                .hasMessageContaining("No Priority Interest entitlement");
        verify(priorityInterestRepository, never()).save(any());
    }
}
