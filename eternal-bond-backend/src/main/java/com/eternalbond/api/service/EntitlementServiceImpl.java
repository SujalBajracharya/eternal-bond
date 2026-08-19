package com.eternalbond.api.service;

import com.eternalbond.api.dto.EntitlementResponse;
import com.eternalbond.api.dto.ProfileBoostGrantResponse;
import com.eternalbond.api.exception.LimitExceededException;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.EntitlementKey;
import com.eternalbond.api.model.ProductCatalog;
import com.eternalbond.api.model.UserDailyUsage;
import com.eternalbond.api.model.UserEntitlement;
import com.eternalbond.api.repository.ProductCatalogRepository;
import com.eternalbond.api.repository.UserDailyUsageRepository;
import com.eternalbond.api.repository.UserEntitlementRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class EntitlementServiceImpl implements EntitlementService {

    private static final Logger log = LoggerFactory.getLogger(EntitlementServiceImpl.class);

    // Business rule constants
    private static final int FREE_DAILY_LIKES   = 3;
    private static final int PREMIUM_BONUS_LIKES = 3;   // 3 base + 3 = 6 total
    // Premium users get unlimited reveals — we use Integer.MAX_VALUE as a sentinel
    private static final int PREMIUM_DAILY_REVEALS = Integer.MAX_VALUE;
    private static final int FREE_DAILY_REVEALS = 1;

    private final UserEntitlementRepository entitlementRepo;
    private final UserDailyUsageRepository  dailyUsageRepo;
    private final ProductCatalogRepository  productCatalogRepo;
    private final ObjectMapper              objectMapper;

    public EntitlementServiceImpl(
            UserEntitlementRepository entitlementRepo,
            UserDailyUsageRepository dailyUsageRepo,
            ProductCatalogRepository productCatalogRepo,
            ObjectMapper objectMapper) {
        this.entitlementRepo     = entitlementRepo;
        this.dailyUsageRepo      = dailyUsageRepo;
        this.productCatalogRepo  = productCatalogRepo;
        this.objectMapper        = objectMapper;
    }

    // ── Snapshot ─────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public EntitlementResponse getEntitlements(String userId) {
        boolean premium      = hasActivePremium(userId);
        String  tier         = getCurrentTier(userId);
        boolean yearly       = "premium_yearly".equals(tier);
        UserDailyUsage usage = getOrCreateTodayUsage(userId);

        int dailyLikeLimit    = premium ? FREE_DAILY_LIKES + PREMIUM_BONUS_LIKES : FREE_DAILY_LIKES;
        int extraLikeCount    = countUnconsumed(userId, EntitlementKey.extra_like);
        int effectiveLimit    = dailyLikeLimit + extraLikeCount;
        int likesRemaining    = Math.max(0, effectiveLimit - usage.getLikesUsed());
        boolean canLike       = likesRemaining > 0;

        int dailyRevealLimit  = premium ? PREMIUM_DAILY_REVEALS : FREE_DAILY_REVEALS;
        // For premium users, reveals are unlimited (MAX_VALUE sentinel means no cap)
        int revealsRemaining  = premium ? Integer.MAX_VALUE : Math.max(0, dailyRevealLimit - usage.getRevealsUsed());
        boolean canRevealFree = premium || revealsRemaining > 0;

        // Profile boosts have an explicit activation state so recurring grants can remain available.
        LocalDateTime now = LocalDateTime.now();
        List<UserEntitlement> boosts = entitlementRepo.findActiveProfileBoosts(userId, now);
        List<UserEntitlement> availableBoosts = entitlementRepo.findAvailableProfileBoosts(userId, now);
        List<UserEntitlement> boostGrants = new ArrayList<>(availableBoosts);
        boostGrants.addAll(boosts);
        boolean boostActive          = !boosts.isEmpty();
        Long    boostExpiresAt       = boostActive
                ? toEpochMs(boosts.get(0).getExpiresAt())
                : null;

        return EntitlementResponse.builder()
                .premium(premium)
                .tier(tier)
                // Likes
                .dailyLikeLimit(dailyLikeLimit)
                .likesUsedToday(usage.getLikesUsed())
                .likesRemainingToday(likesRemaining)
                .canLike(canLike)
                .extraLikePurchasedToday(usage.isExtraLikePurchased())
                // Reveals — premium = unlimited (MAX_VALUE); free = 0 per day unless purchased
                .dailyRevealLimit(premium ? -1 : dailyRevealLimit)  // -1 signals "unlimited" to frontend
                .revealsUsedToday(usage.getRevealsUsed())
                .canRevealFree(canRevealFree)
                .revealPurchasedToday(usage.isRevealPurchased())
                // Feature gates
                .canUndoSkip(premium || countUnconsumed(userId, EntitlementKey.undo_skip) > 0)
                .chatExpiryDisabled(premium)
                .kundaliEnabled(premium || hasActiveEntitlement(userId, EntitlementKey.kundali_access))
                .advancedFiltersEnabled(premium || hasActiveEntitlement(userId, EntitlementKey.advanced_filters))
                .readReceiptsEnabled(premium)
                .priorityBadgeEnabled(premium)
                .priorityCustomerCareEnabled(yearly)
                .lockedInPricingEnabled(yearly)
                .profileBoostActive(boostActive)
                .profileBoostExpiresAt(boostExpiresAt)
                .profileBoostsAvailable(availableBoosts.size())
                .profileBoostGrants(boostGrants.stream()
                    .map(boost -> ProfileBoostGrantResponse.builder()
                        .grantType(boost.getGrantType())
                        .grantPeriod(boost.getGrantPeriod())
                        .available(availableBoosts.contains(boost))
                        .active(boosts.contains(boost))
                        .expiresAt(boost.getExpiresAt())
                        .build())
                    .toList())
                // Pending single-use counts
                .pendingUndoSkips(countUnconsumed(userId, EntitlementKey.undo_skip))
                .pendingChatExtensions(countUnconsumed(userId, EntitlementKey.extend_chat))
                .pendingRevealLikes(countUnconsumed(userId, EntitlementKey.reveal_like))
                .pendingPriorityInterests(countUnconsumed(userId, EntitlementKey.priority_interest))
                .build();
    }

    // ── Premium ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public boolean hasActivePremium(String userId) {
        return entitlementRepo.hasPremiumAccess(userId, LocalDateTime.now());
    }

    @Override
    public EntitlementResponse activateProfileBoost(String userId) {
        LocalDateTime now = LocalDateTime.now();
        if (!hasActivePremium(userId)) {
            throw new IllegalArgumentException("An active Premium subscription is required to activate this Profile Boost.");
        }
        if (!entitlementRepo.findActiveProfileBoosts(userId, now).isEmpty()) {
            throw new IllegalArgumentException("A Profile Boost is already active.");
        }

        UserEntitlement boost = entitlementRepo.findFirstAvailableProfileBoostForUpdate(userId, now)
                .orElseThrow(() -> new ResourceNotFoundException("No Profile Boost is available to activate."));

        boost.setActivatedAt(now);
        boost.setExpiresAt(now.plusHours(24));
        try {
            entitlementRepo.saveAndFlush(boost);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("A Profile Boost is already active.", ex);
        }
        return getEntitlements(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public String getCurrentTier(String userId) {
        if (!hasActivePremium(userId)) return "free";

        // Find the product that granted the active premium_access entitlement
        List<UserEntitlement> premiumEntitlements = entitlementRepo.findActiveEntitlements(
                userId, EntitlementKey.premium_access, LocalDateTime.now());

        if (premiumEntitlements.isEmpty()) return "free";

        if (premiumEntitlements.stream()
                .anyMatch(e -> "premium_yearly".equals(e.getGrantedByProduct()))) {
            return "premium_yearly";
        }
        return "premium_monthly";
    }

    // ── Daily Likes ───────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public int getDailyLikeLimit(String userId) {
        return hasActivePremium(userId)
                ? FREE_DAILY_LIKES + PREMIUM_BONUS_LIKES
                : FREE_DAILY_LIKES;
    }

    @Override
    public boolean canLike(String userId) {
        UserDailyUsage usage = getOrCreateTodayUsage(userId);
        int baseLimit        = getDailyLikeLimit(userId);
        int extraLikes       = countUnconsumed(userId, EntitlementKey.extra_like);
        return usage.getLikesUsed() < (baseLimit + extraLikes);
    }

    @Override
    public void consumeLike(String userId) {
        if (!canLike(userId)) {
            throw new LimitExceededException(
                    "Daily like limit reached. Purchase an extra like or upgrade to Premium.");
        }

        UserDailyUsage usage = getOrCreateTodayUsage(userId);
        int baseLimit        = getDailyLikeLimit(userId);

        // If the user is over their base limit they must have a purchased extra like — consume it
        if (usage.getLikesUsed() >= baseLimit) {
            Optional<UserEntitlement> extra = entitlementRepo.findFirstUnconsumed(
                    userId, EntitlementKey.extra_like, LocalDateTime.now());
            extra.ifPresent(e -> {
                e.setConsumed(true);
                entitlementRepo.save(e);
            });
        }

        dailyUsageRepo.incrementLikesUsed(userId, LocalDate.now());
        log.debug("Like consumed for user {}. Total today: {}", userId, usage.getLikesUsed() + 1);
    }

    // ── Reveals ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public boolean canRevealFree(String userId) {
        // Premium users have unlimited reveals — always true
        if (hasActivePremium(userId)) return true;
        UserDailyUsage usage = getOrCreateTodayUsage(userId);
        return usage.getRevealsUsed() < PREMIUM_DAILY_REVEALS;
    }

    @Override
    public EntitlementResponse consumeFreeReveal(String userId) {
        if (hasActivePremium(userId)) {
            return getEntitlements(userId);
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        getOrCreateTodayUsage(userId);
        int updated = dailyUsageRepo.incrementRevealsUsedIfAvailable(
                userId, today, FREE_DAILY_REVEALS);
        if (updated == 0) {
            throw new LimitExceededException("Today's free Reveal Like has already been used.");
        }
        return getEntitlements(userId);
    }

    // ── Entitlement Granting ──────────────────────────────────────────────────

    @Override
    public UserEntitlement grantEntitlement(
            String userId,
            String productId,
            String paymentId,
            LocalDateTime expiresAt,
            Map<String, String> metadata) {

        // Idempotency: never double-grant the same payment
        if (paymentId != null && entitlementRepo.existsByPaymentId(paymentId)) {
            log.warn("Entitlement already granted for payment {}. Skipping duplicate grant.", paymentId);
            // Return the existing one
            return entitlementRepo.findAllByUserIdOrderByGrantedAtDesc(userId)
                    .stream()
                    .filter(e -> paymentId.equals(e.getPaymentId()))
                    .findFirst()
                    .orElseThrow();
        }

        EntitlementKey key = resolveEntitlementKey(productId);

        // Mark once-per-day purchased flags
        markPurchasedFlag(userId, productId);

        String metadataJson = null;
        if (metadata != null && !metadata.isEmpty()) {
            try {
                metadataJson = objectMapper.writeValueAsString(metadata);
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize metadata for entitlement grant", e);
            }
        }

        LocalDateTime grantedAt = LocalDateTime.now();
        UserEntitlement entitlement = UserEntitlement.builder()
                .userId(userId)
                .entitlementKey(key)
                .grantedByProduct(productId)
                .paymentId(paymentId)
                .grantedAt(grantedAt)
                .expiresAt(expiresAt)
                .consumed(false)
                .active(true)
                .activatedAt("profile_boost".equals(productId) ? grantedAt : null)
                .metadata(metadataJson)
                .build();

        entitlement = entitlementRepo.save(entitlement);
        log.info("Granted entitlement {} to user {} (product: {}, payment: {})",
                key, userId, productId, paymentId);

        return entitlement;
    }

    @Override
    public void consumeEntitlement(String userId, EntitlementKey key) {
        UserEntitlement entitlement = entitlementRepo
                .findFirstUnconsumed(userId, key, LocalDateTime.now())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No unconsumed " + key + " entitlement found for user " + userId));

        entitlement.setConsumed(true);
        entitlementRepo.save(entitlement);
        log.info("Consumed entitlement {} for user {}", key, userId);
    }

    // ── Daily Usage ───────────────────────────────────────────────────────────

    @Override
    public UserDailyUsage getOrCreateTodayUsage(String userId) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        return dailyUsageRepo.findByUserIdAndUsageDate(userId, today)
                .orElseGet(() -> {
                    UserDailyUsage newUsage = UserDailyUsage.builder()
                            .userId(userId)
                            .usageDate(today)
                            .build();
                    return dailyUsageRepo.save(newUsage);
                });
    }

    // ── Expiry Maintenance ────────────────────────────────────────────────────

    @Override
    @Scheduled(fixedRateString = "${monetization.entitlement-expiry-check-ms:3600000}")
    public int expireStaleEntitlements() {
        int count = entitlementRepo.expireStaleEntitlements(LocalDateTime.now());
        if (count > 0) {
            log.info("Expired {} stale entitlements.", count);
        }
        return count;
    }

    /** Reconciles the current period's Premium boost grants without duplicating them. */
    @Scheduled(fixedRateString = "${monetization.profile-boost-grant-check-ms:3600000}")
    public void grantRecurringProfileBoosts() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        String week = today.get(WeekFields.ISO.weekBasedYear()) + "-W" + String.format("%02d",
            today.get(WeekFields.ISO.weekOfWeekBasedYear()));
        String month = today.toString().substring(0, 7);

        for (String userId : entitlementRepo.findAllActivePremiumUserIds(LocalDateTime.now())) {
            List<UserEntitlement> premium = entitlementRepo.findActiveEntitlements(
                    userId, EntitlementKey.premium_access, LocalDateTime.now());
            boolean yearly = premium.stream()
                    .anyMatch(e -> "premium_yearly".equals(e.getGrantedByProduct()));
            String product = yearly ? "premium_yearly" : "premium_monthly";

            grantPeriodicBoost(userId, product, "premium_weekly", week);
            if (yearly) {
                grantPeriodicBoost(userId, product, "premium_monthly", month + "-1");
                grantPeriodicBoost(userId, product, "premium_monthly", month + "-2");
            }
        }
    }

    private void grantPeriodicBoost(String userId, String product, String grantType, String grantPeriod) {
        if (entitlementRepo.existsByUserIdAndEntitlementKeyAndGrantTypeAndGrantPeriod(
                userId, EntitlementKey.profile_boost, grantType, grantPeriod)) {
            return;
        }

        entitlementRepo.save(UserEntitlement.builder()
                .userId(userId)
                .entitlementKey(EntitlementKey.profile_boost)
                .grantedByProduct(product)
                .grantedAt(LocalDateTime.now())
                .expiresAt(null)
                .consumed(false)
                .active(true)
                .grantType(grantType)
                .grantPeriod(grantPeriod)
                .activatedAt(null)
                .build());
        log.info("Granted {} profile boost {} to user {}", grantType, grantPeriod, userId);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    /**
     * Maps a product ID from the catalog to the corresponding entitlement key.
     * This is the single place where product → entitlement mapping lives.
     */
    private EntitlementKey resolveEntitlementKey(String productId) {
        return switch (productId) {
            case "extra_like"      -> EntitlementKey.extra_like;
            case "undo_skip"       -> EntitlementKey.undo_skip;
            case "reveal_like"     -> EntitlementKey.reveal_like;
            case "priority_interest" -> EntitlementKey.priority_interest;
            case "extend_chat"     -> EntitlementKey.extend_chat;
            case "profile_boost"   -> EntitlementKey.profile_boost;
            case "premium_monthly",
                 "premium_yearly"  -> EntitlementKey.premium_access;
            default -> throw new IllegalArgumentException("Unknown product ID: " + productId);
        };
    }

    /**
     * Returns how many unconsumed, active, non-expired entitlements of the given key the user has.
     */
    private int countUnconsumed(String userId, EntitlementKey key) {
        return entitlementRepo.findActiveEntitlements(userId, key, LocalDateTime.now()).size();
    }

    /**
     * Returns true if the user has at least one active entitlement for the given key.
     */
    private boolean hasActiveEntitlement(String userId, EntitlementKey key) {
        return !entitlementRepo.findActiveEntitlements(userId, key, LocalDateTime.now()).isEmpty();
    }

    /**
     * After granting certain product types, mark the once-per-day purchase flag.
     */
    private void markPurchasedFlag(String userId, String productId) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        // Ensure row exists
        getOrCreateTodayUsage(userId);

        switch (productId) {
            case "extra_like"  -> dailyUsageRepo.markExtraLikePurchased(userId, today);
            case "reveal_like" -> dailyUsageRepo.markRevealPurchased(userId, today);
            default            -> { /* no daily flag needed */ }
        }
    }

    private Long toEpochMs(LocalDateTime ldt) {
        if (ldt == null) return null;
        return ldt.toInstant(ZoneOffset.UTC).toEpochMilli();
    }
}
