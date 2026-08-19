package com.eternalbond.api.service;

import com.eternalbond.api.model.EntitlementKey;
import com.eternalbond.api.model.UserDailyUsage;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RevealConsumptionTest {

    @Mock private UserEntitlementRepository entitlementRepository;
    @Mock private UserDailyUsageRepository dailyUsageRepository;
    @Mock private ProductCatalogRepository productCatalogRepository;

    @Test
    void freeUserConsumesOneDailyRevealAtomically() {
        UserDailyUsage usage = usage(0);
        when(entitlementRepository.hasPremiumAccess(eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(false);
        when(dailyUsageRepository.findByUserIdAndUsageDate(eq("user-1"), any(LocalDate.class)))
                .thenReturn(Optional.of(usage));
        when(dailyUsageRepository.incrementRevealsUsedIfAvailable(
                eq("user-1"), any(LocalDate.class), eq(1))).thenAnswer(invocation -> {
                    usage.setRevealsUsed(usage.getRevealsUsed() + 1);
                    return 1;
                });
        when(entitlementRepository.findActiveEntitlements(
                eq("user-1"), any(EntitlementKey.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(entitlementRepository.findActiveProfileBoosts(eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(entitlementRepository.findAvailableProfileBoosts(eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(List.of());

        EntitlementServiceImpl service = new EntitlementServiceImpl(
                entitlementRepository, dailyUsageRepository, productCatalogRepository, new ObjectMapper());

        var response = service.consumeFreeReveal("user-1");

        assertThat(response.getRevealsUsedToday()).isEqualTo(1);
        assertThat(response.isCanRevealFree()).isFalse();
        verify(dailyUsageRepository).incrementRevealsUsedIfAvailable(
                eq("user-1"), any(LocalDate.class), eq(1));
    }

    @Test
    void freeUserCannotConsumeSecondDailyReveal() {
        when(entitlementRepository.hasPremiumAccess(eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(false);
        when(dailyUsageRepository.findByUserIdAndUsageDate(eq("user-1"), any(LocalDate.class)))
                .thenReturn(Optional.of(usage(1)));
        when(dailyUsageRepository.incrementRevealsUsedIfAvailable(
                eq("user-1"), any(LocalDate.class), eq(1))).thenReturn(0);

        EntitlementServiceImpl service = new EntitlementServiceImpl(
                entitlementRepository, dailyUsageRepository, productCatalogRepository, new ObjectMapper());

        assertThatThrownBy(() -> service.consumeFreeReveal("user-1"))
                .isInstanceOf(com.eternalbond.api.exception.LimitExceededException.class)
                .hasMessageContaining("already been used");
    }

    @Test
    void premiumUserDoesNotConsumeFreeCounter() {
        when(entitlementRepository.hasPremiumAccess(eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(true);
        when(dailyUsageRepository.findByUserIdAndUsageDate(eq("user-1"), any(LocalDate.class)))
                .thenReturn(Optional.of(usage(4)));
        when(entitlementRepository.findActiveEntitlements(
                eq("user-1"), any(EntitlementKey.class), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(entitlementRepository.findActiveProfileBoosts(eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(entitlementRepository.findAvailableProfileBoosts(eq("user-1"), any(LocalDateTime.class)))
                .thenReturn(List.of());

        EntitlementServiceImpl service = new EntitlementServiceImpl(
                entitlementRepository, dailyUsageRepository, productCatalogRepository, new ObjectMapper());

        var response = service.consumeFreeReveal("user-1");

        assertThat(response.isPremium()).isTrue();
        verify(dailyUsageRepository, never()).incrementRevealsUsedIfAvailable(any(), any(), anyInt());
    }

    private UserDailyUsage usage(int revealsUsed) {
        return UserDailyUsage.builder()
                .userId("user-1")
                .usageDate(LocalDate.now())
                .revealsUsed(revealsUsed)
                .build();
    }
}
