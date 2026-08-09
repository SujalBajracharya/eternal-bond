package com.eternalbond.api.service;

import com.eternalbond.api.dto.EntitlementResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class EntitlementServiceImpl implements EntitlementService {

    private static final Logger log = LoggerFactory.getLogger(EntitlementServiceImpl.class);

    // Business rule constants
    private static final int FREE_DAILY_LIKES   = 3;
    private static final int PREMIUM_BONUS_LIKES = 3;   // 3 base + 3 = 6 total
    private static final int PREMIUM_DAILY_REVEALS = 3;

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
        UserDailyUsage usage = getOrCreateTodayUsage(userId);

        int dailyLikeLimit    = premium ? FREE_DAILY_LIKES + PREMIUM_BONUS_LIKES : FREE_DAILY_LIKES;
        int extraLikeCount    = countUnconsumed(userId, EntitlementKey.extra_like);
        int effectiveLimit    = dailyLikeLimit + extraLikeCount;
        int likesRemaining    = Math.max(0, effectiveLimit - usage.getLikesUsed());
        boolean canLike       = likesRemaining > 0;

        int dailyRevealLimit  = premium ? PREMIUM_DAILY_REVEALS : 0;
        int revealsRemaining  = Math.max(0, dailyRevealLimit - usage.getRevealsUsed());
        boolean canRevealFree = revealsRemaining > 0;

        // Profile boost: check if there's an active non-expired profile_boost entitlement
        List<UserEntitlement> boosts = entitlementRepo.findActiveEntitlements(
                userId, EntitlementKey.profile_boost, LocalDateTime.now());
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
                // Reveals
                .dailyRevealLimit(dailyRevealLimit)
                .revealsUsedToday(usage.getRevealsUsed())
                .canRevealFree(canRevealFree)
                .revealPurchasedToday(usage.isRevealPurchased())
                // Feature gates
                .canUndoSkip(premium || countUnconsumed(userId, EntitlementKey.undo_skip) > 0)
                .chatExpiryDisabled(premium)
                .kundaliEnabled(premium || hasActiveEntitlement(userId, EntitlementKey.kundali_access))
                .advancedFiltersEnabled(premium || hasActiveEntitlement(userId, EntitlementKey.advanced_filters))
                .profileBoostActive(boostActive)
                .profileBoostExpiresAt(boostExpiresAt)
                // Pending single-use counts
                .pendingUndoSkips(countUnconsumed(userId, EntitlementKey.undo_skip))
                .pendingChatExtensions(countUnconsumed(userId, EntitlementKey.extend_chat))
                .pendingRevealLikes(countUnconsumed(userId, EntitlementKey.reveal_like))
                .build();
    }

    // ── Premium ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public boolean hasActivePremium(String userId) {
        return entitlementRepo.hasPremiumAccess(userId, LocalDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public String getCurrentTier(String userId) {
        if (!hasActivePremium(userId)) return "free";

        // Find the product that granted the active premium_access entitlement
        List<UserEntitlement> premiumEntitlements = entitlementRepo.findActiveEntitlements(
                userId, EntitlementKey.premium_access, LocalDateTime.now());

        if (premiumEntitlements.isEmpty()) return "free";

        String productId = premiumEntitlements.get(0).getGrantedByProduct();
        if ("premium_yearly".equals(productId)) return "premium_yearly";
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
        if (!hasActivePremium(userId)) return false;
        UserDailyUsage usage = getOrCreateTodayUsage(userId);
        return usage.getRevealsUsed() < PREMIUM_DAILY_REVEALS;
    }

    @Override
    public void consumeFreeReveal(String userId) {
        dailyUsageRepo.incrementRevealsUsed(userId, LocalDate.now());
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

        UserEntitlement entitlement = UserEntitlement.builder()
                .userId(userId)
                .entitlementKey(key)
                .grantedByProduct(productId)
                .paymentId(paymentId)
                .grantedAt(LocalDateTime.now())
                .expiresAt(expiresAt)
                .consumed(false)
                .active(true)
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
