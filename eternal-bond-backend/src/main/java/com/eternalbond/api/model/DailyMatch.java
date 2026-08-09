package com.eternalbond.api.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Persists the daily recommendation batch assigned to a user for a specific calendar date.
 * <p>
 * Design rationale:
 * <ul>
 *   <li>One row per (userId, recommendedProfileId, matchDate) triple.</li>
 *   <li>A unique constraint on (user_id, match_date, sort_order) preserves stable ordering
 *       so the same 5 profiles are always returned in the same sequence across restarts.</li>
 *   <li>A unique constraint on (user_id, recommended_profile_id, match_date) prevents the
 *       same profile being inserted twice into a day's batch.</li>
 * </ul>
 */
@Entity
@Table(
    name = "daily_matches",
    schema = "public",
    uniqueConstraints = {
        // No duplicate profile in the same user's day
        @UniqueConstraint(
            name = "uq_daily_match_user_profile_date",
            columnNames = {"user_id", "recommended_profile_id", "match_date"}
        ),
        // Stable ordering: one position per user per day
        @UniqueConstraint(
            name = "uq_daily_match_user_date_order",
            columnNames = {"user_id", "match_date", "sort_order"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** The user who received this recommendation (FK → profiles.id). */
    @Column(name = "user_id", nullable = false)
    private String userId;

    /** The profile that was recommended (FK → profiles.id). */
    @Column(name = "recommended_profile_id", nullable = false)
    private String recommendedProfileId;

    /** Calendar date of this batch — based purely on calendar day, not 24-hour window. */
    @Column(name = "match_date", nullable = false)
    private LocalDate matchDate;

    /**
     * 0-based position within the day's batch (0–4).
     * Kept so repeated fetches return profiles in a consistent, deterministic order.
     */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
