package com.eternalbond.api.service;

import com.eternalbond.api.model.EntitlementKey;
import com.eternalbond.api.model.UserEntitlement;
import com.eternalbond.api.repository.ProductCatalogRepository;
import com.eternalbond.api.repository.UserDailyUsageRepository;
import com.eternalbond.api.repository.UserEntitlementRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EntitlementServiceImplTest {

    @Mock private UserEntitlementRepository entitlementRepo;
    @Mock private UserDailyUsageRepository dailyUsageRepo;
    @Mock private ProductCatalogRepository productCatalogRepo;

    @Test
    void recurringMonthlyBoostGrantsExactlyOneWeeklyBoost() {
        EntitlementServiceImpl service = new EntitlementServiceImpl(
                entitlementRepo, dailyUsageRepo, productCatalogRepo, new ObjectMapper());
        UserEntitlement monthly = premium("premium_monthly");

        when(entitlementRepo.findAllActivePremiumUserIds(any(LocalDateTime.class)))
                .thenReturn(List.of("monthly-user"));
        when(entitlementRepo.findActiveEntitlements(
                eq("monthly-user"), eq(EntitlementKey.premium_access), any(LocalDateTime.class)))
                .thenReturn(List.of(monthly));
        when(entitlementRepo.existsByUserIdAndEntitlementKeyAndGrantTypeAndGrantPeriod(
                anyString(), any(), anyString(), anyString())).thenReturn(false);

        service.grantRecurringProfileBoosts();

        ArgumentCaptor<UserEntitlement> captor = ArgumentCaptor.forClass(UserEntitlement.class);
        verify(entitlementRepo).save(captor.capture());
        assertThat(captor.getValue().getEntitlementKey()).isEqualTo(EntitlementKey.profile_boost);
        assertThat(captor.getValue().getGrantedByProduct()).isEqualTo("premium_monthly");
        assertThat(captor.getValue().getGrantType()).isEqualTo("premium_weekly");
        assertThat(captor.getValue().getGrantPeriod()).matches("\\d{4}-W\\d{2}");
    }

    @Test
    void recurringYearlyBoostGrantsAreIdempotentAndSeparate() {
        EntitlementServiceImpl service = new EntitlementServiceImpl(
                entitlementRepo, dailyUsageRepo, productCatalogRepo, new ObjectMapper());
        UserEntitlement monthly = premium("premium_monthly");
        UserEntitlement yearly = premium("premium_yearly");
        Set<String> granted = new HashSet<>();

        when(entitlementRepo.findAllActivePremiumUserIds(any(LocalDateTime.class)))
                .thenReturn(List.of("user-1"));
        when(entitlementRepo.findActiveEntitlements(
                eq("user-1"), eq(EntitlementKey.premium_access), any(LocalDateTime.class)))
                .thenReturn(List.of(monthly, yearly));
        when(entitlementRepo.existsByUserIdAndEntitlementKeyAndGrantTypeAndGrantPeriod(
                anyString(), any(), anyString(), anyString()))
                .thenAnswer(invocation -> !granted.add(
                        invocation.getArgument(0) + ":" + invocation.getArgument(2) + ":" + invocation.getArgument(3)));

        service.grantRecurringProfileBoosts();
        service.grantRecurringProfileBoosts();

        ArgumentCaptor<UserEntitlement> captor = ArgumentCaptor.forClass(UserEntitlement.class);
        verify(entitlementRepo, times(3)).save(captor.capture());
        assertThat(captor.getAllValues()).extracting(UserEntitlement::getGrantType)
                .containsExactlyInAnyOrder("premium_weekly", "premium_monthly", "premium_monthly");
        assertThat(captor.getAllValues()).allMatch(boost ->
                boost.getEntitlementKey() == EntitlementKey.profile_boost
                        && boost.getGrantPeriod() != null);
    }

    @Test
    void expiredPremiumReceivesNoPeriodicBoost() {
        EntitlementServiceImpl service = new EntitlementServiceImpl(
                entitlementRepo, dailyUsageRepo, productCatalogRepo, new ObjectMapper());
        when(entitlementRepo.findAllActivePremiumUserIds(any(LocalDateTime.class)))
                .thenReturn(List.of());

        service.grantRecurringProfileBoosts();

        verify(entitlementRepo, never()).save(any(UserEntitlement.class));
    }

    private UserEntitlement premium(String product) {
        return UserEntitlement.builder()
                .userId("user-1")
                .entitlementKey(EntitlementKey.premium_access)
                .grantedByProduct(product)
                .active(true)
                .consumed(false)
                .expiresAt(LocalDateTime.now().plusMonths(6))
                .build();
    }
}