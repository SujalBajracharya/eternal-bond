package com.eternalbond.api.dto;

import lombok.*;

/**
 * Complete entitlement snapshot returned to the frontend.
 * This is the single source of truth for what a user can do right now.
 * The frontend uses this to enable/disable UI affordances without
 * scattering permission checks throughout the component tree.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntitlementResponse {

    // ── Subscription tier ─────────────────────────────────────────
    /** true if the user has an active premium subscription */
    private boolean premium;

    /** "free" | "premium_monthly" | "premium_yearly" */
    private String tier;

    // ── Daily Likes ────────────────────────────────────────────────
    /** How many likes the user is allowed today (3 free + 3 premium if applicable) */
    private int dailyLikeLimit;

    /** How many likes the user has already sent today */
    private int likesUsedToday;

    /** How many likes remain today */
    private int likesRemainingToday;

    /** Whether the user can still send likes today */
    private boolean canLike;

    /** Whether the user already purchased an extra like today (once-per-day gate) */
    private boolean extraLikePurchasedToday;

    // ── Reveal Likes ───────────────────────────────────────────────
    /**
     * How many reveals the user may use today.
     * Free: 0 (must pay per reveal). Premium: 3 per day.
     */
    private int dailyRevealLimit;

    /** How many reveals the user has already used today */
    private int revealsUsedToday;

    /** Whether the user can still reveal for free today */
    private boolean canRevealFree;

    /** Whether the user already purchased a reveal today (once-per-day gate for pay-per-action) */
    private boolean revealPurchasedToday;

    // ── Feature Gates ──────────────────────────────────────────────
    /** Premium: can undo skipped profiles (unlimited). Free: must pay per undo. */
    private boolean canUndoSkip;

    /** Premium: chats don't expire while subscription is active */
    private boolean chatExpiryDisabled;

    /** Premium: access to Kundali compatibility feature */
    private boolean kundaliEnabled;

    /** Premium: access to advanced discovery filters */
    private boolean advancedFiltersEnabled;

    /** Premium: read receipts in chat (know when messages are read) */
    private boolean readReceiptsEnabled;

    /** Premium: user appears with a priority interest badge in others' feeds */
    private boolean priorityBadgeEnabled;

    /** Premium: profile is boosted in recommendations */
    private boolean profileBoostActive;

    /** If boost is active, when it expires (epoch ms) */
    private Long profileBoostExpiresAt;

    // ── Unconsumed single-use entitlements ─────────────────────────
    /** Number of unconsumed undo_skip entitlements (from pay-per-action) */
    private int pendingUndoSkips;

    /** Number of unconsumed extend_chat entitlements */
    private int pendingChatExtensions;

    /** Number of unconsumed reveal_like entitlements */
    private int pendingRevealLikes;
}
