package com.eternalbond.api.service;

import com.eternalbond.api.model.EntitlementKey;
import com.eternalbond.api.model.UserDailyUsage;
import com.eternalbond.api.model.UserEntitlement;
import com.eternalbond.api.repository.ProductCatalogRepository;
import com.eternalbond.api.repository.UserDailyUsageRepository;
import com.eternalbond.api.repository.UserEntitlementRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileBoostActivationTest {

    @Mock private UserEntitlementRepository entitlementRepository;
    @Mock private UserDailyUsageRepository dailyUsageRepository;
    @Mock private ProductCatalogRepository productCatalogRepository;

    @Test
    void activatesAvailableBoostAndReturnsActiveState() {
        UserEntitlement boost = UserEntitlement.builder()
                .id(UUID.randomUUID())
                .userId("user-1")
                .entitlementKey(EntitlementKey.profile_boost)
                .grantType("premium_weekly")
                .grantPeriod("2026-W34")
                .active(true)
                .consumed(false)
                .build();
        EntitlementServiceImpl service = serviceWithPremiumSnapshot(boost);

        when(entitlementRepository.findActiveProfileBoosts(eq("user-1"), any(LocalDateTime.class)))
                .thenAnswer(invocation -> boost.getActivatedAt() == null ? List.of() : List.of(boost));
        when(entitlementRepository.findAvailableProfileBoosts(eq("user-1"), any(LocalDateTime.class)))
                .thenAnswer(invocation -> boost.getActivatedAt() == null ? List.of(boost) : List.of());
        when(entitlementRepository.findFirstAvailableProfileBoostForUpdate(
                eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(boost));

        var response = service.activateProfileBoost("user-1");

        assertThat(response.isProfileBoostActive()).isTrue();
        assertThat(response.getProfileBoostExpiresAt()).isNotNull();
        assertThat(response.getProfileBoostsAvailable()).isZero();
        assertThat(boost.getActivatedAt()).isNotNull();
        assertThat(boost.getExpiresAt()).isAfter(LocalDateTime.now());
        verify(entitlementRepository).saveAndFlush(boost);
    }

    @Test
    void rejectsActivationWhenBoostAlreadyActive() {
        EntitlementServiceImpl service = new EntitlementServiceImpl(
                entitlementRepository, dailyUsageRepository, productCatalogRepository, new ObjectMapper());
        when(entitlementRepository.hasPremiumAccess(eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(true);
        UserEntitlement active = UserEntitlement.builder()
                .userId("user-1")
                .entitlementKey(EntitlementKey.profile_boost)
                .active(true)
                .consumed(false)
                .activatedAt(LocalDateTime.now().minusHours(1))
                .expiresAt(LocalDateTime.now().plusHours(23))
                .build();
        when(entitlementRepository.findActiveProfileBoosts(eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(List.of(active));

        assertThatThrownBy(() -> service.activateProfileBoost("user-1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already active");
        verify(entitlementRepository, never()).findFirstAvailableProfileBoostForUpdate(any(), any());
    }

    @Test
    void rejectsActivationWhenPremiumHasExpired() {
        EntitlementServiceImpl service = new EntitlementServiceImpl(
                entitlementRepository, dailyUsageRepository, productCatalogRepository, new ObjectMapper());
        when(entitlementRepository.hasPremiumAccess(eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(false);

        assertThatThrownBy(() -> service.activateProfileBoost("user-1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("active Premium");
        verify(entitlementRepository, never()).findFirstAvailableProfileBoostForUpdate(any(), any());
    }

    private EntitlementServiceImpl serviceWithPremiumSnapshot(UserEntitlement boost) {
        when(entitlementRepository.hasPremiumAccess(eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(true);
        when(dailyUsageRepository.findByUserIdAndUsageDate(eq("user-1"), any(LocalDate.class)))
                .thenReturn(Optional.of(UserDailyUsage.builder()
                        .userId("user-1")
                        .usageDate(LocalDate.now())
                        .build()));
        when(entitlementRepository.findActiveEntitlements(
                eq("user-1"), any(EntitlementKey.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        return new EntitlementServiceImpl(
                entitlementRepository, dailyUsageRepository, productCatalogRepository, new ObjectMapper());
    }
}
