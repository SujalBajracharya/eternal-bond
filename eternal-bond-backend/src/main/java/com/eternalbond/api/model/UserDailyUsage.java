package com.eternalbond.api.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Tracks per-user, per-day usage counters.
 * A new row is upserted at the start of each day automatically.
 * Daily limits are enforced against these counters.
 */
@Entity
@Table(
    name = "user_daily_usage",
    schema = "public",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "usage_date"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDailyUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    /** How many likes have been sent today (counts against free/premium daily limits). */
    @Column(name = "likes_used", nullable = false)
    @Builder.Default
    private int likesUsed = 0;

    /** How many profile reveals have been used today. */
    @Column(name = "reveals_used", nullable = false)
    @Builder.Default
    private int revealsUsed = 0;

    /**
     * Whether the user already purchased an extra_like today.
     * Extra likes can only be purchased once per day.
     */
    @Column(name = "extra_like_purchased", nullable = false)
    @Builder.Default
    private boolean extraLikePurchased = false;

    /**
     * Whether the user already purchased a reveal_like today.
     * Paid reveals can only be purchased once per day.
     */
    @Column(name = "reveal_purchased", nullable = false)
    @Builder.Default
    private boolean revealPurchased = false;
}
