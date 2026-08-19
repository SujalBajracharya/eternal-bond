package com.eternalbond.api.service;

import com.eternalbond.api.dto.EntitlementResponse;
import com.eternalbond.api.exception.LimitExceededException;
import com.eternalbond.api.model.EntitlementKey;
import com.eternalbond.api.model.UserDailyUsage;
import com.eternalbond.api.model.UserEntitlement;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Central entitlement service for the three-tier monetization system.
 *
 * All feature gates in the application should go through this service.
 * Do NOT scatter premium/free checks throughout the codebase —
 * query this service instead.
 */
public interface EntitlementService {

    // ── Snapshot ──────────────────────────────────────────────────

    /**
     * Returns a complete entitlement snapshot for the given user.
     * This is the primary endpoint consumed by the frontend.
     */
    EntitlementResponse getEntitlements(String userId);

    // ── Premium ───────────────────────────────────────────────────

    /** Returns true if the user has an active premium subscription right now. */
    boolean hasActivePremium(String userId);

    /** Returns the user's current plan tier: "free", "premium_monthly", or "premium_yearly". */
    String getCurrentTier(String userId);

    /** Activates one available recurring Profile Boost for the user. */
    EntitlementResponse activateProfileBoost(String userId);

    // ── Daily Likes ───────────────────────────────────────────────

    /**
     * Returns the user's effective daily like limit:
     * - Free: 3
     * - Premium: 6 (3 base + 3 premium)
     */
    int getDailyLikeLimit(String userId);

    /**
     * Returns true if the user can send another like today.
     * Accounts for base limit, premium bonus, and any purchased extra likes.
     */
    boolean canLike(String userId);

    /**
     * Records that the user sent one like today.
     * Throws LimitExceededException if the user is already at their limit.
     */
    void consumeLike(String userId);

    // ── Reveals ───────────────────────────────────────────────────

    /**
     * Returns true if the user can reveal a profile who liked them for free.
     * Free users: 0 free reveals (must pay per reveal via reveal_like entitlement).
     * Premium users: unlimited reveals (always returns true).
     */
    boolean canRevealFree(String userId);

    /**
     * Records that the user consumed one free daily reveal.
     */
    EntitlementResponse consumeFreeReveal(String userId);

    // ── Entitlement Granting ──────────────────────────────────────

    /**
     * Grants an entitlement to a user after a successful payment.
     * Called by the webhook handler — only called once payment is confirmed.
     *
     * @param userId         the user who purchased
     * @param productId      the product identifier from the catalog
     * @param paymentId      our internal payment record ID
     * @param expiresAt      null for permanent/single-use; set for time-bounded grants
     * @param metadata       optional context (e.g. conversationId for extend_chat)
     * @return the created UserEntitlement
     */
    UserEntitlement grantEntitlement(
            String userId,
            String productId,
            String paymentId,
            LocalDateTime expiresAt,
            Map<String, String> metadata
    );

    // ── Entitlement Consuming ─────────────────────────────────────

    /**
     * Consumes one unit of a single-use entitlement.
     * For example, consuming an "undo_skip" entitlement when the user undoes a skip.
     * Throws ResourceNotFoundException if no unconsumed entitlement exists.
     */
    void consumeEntitlement(String userId, EntitlementKey key);

    // ── Daily Usage ───────────────────────────────────────────────

    /**
     * Returns the user's daily usage record for today,
     * creating a new row if one doesn't exist yet.
     */
    UserDailyUsage getOrCreateTodayUsage(String userId);

    // ── Expiry Maintenance ────────────────────────────────────────

    /**
     * Expires all entitlements whose expiry time has passed.
     * Should be called by a scheduled task (e.g. every hour).
     */
    int expireStaleEntitlements();
}
