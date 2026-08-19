package com.eternalbond.api.model;

/**
 * Canonical set of entitlements the system can grant to a user.
 * Each value maps directly to the PostgreSQL entitlement_key enum.
 */
public enum EntitlementKey {

    /** One extra like for today (single-use, consumed when like is sent) */
    extra_like,

    /** Undo the most recently skipped profile (single-use, consumed on use) */
    undo_skip,

    /** Extend one expiring chat conversation (single-use per purchase) */
    extend_chat,

    /** Reveal one user who liked the current user (single-use, consumed on use) */
    reveal_like,

    /** Priority Interest sent to one target profile (single-use, consumed on use) */
    priority_interest,

    /** Active premium subscription (time-bounded) */
    premium_access,

    /** Profile boost for 24 hours (time-bounded) */
    profile_boost,

    /** Access to Kundali compatibility feature (from premium or direct purchase) */
    kundali_access,

    /** Access to advanced discovery filters (from premium) */
    advanced_filters
}
