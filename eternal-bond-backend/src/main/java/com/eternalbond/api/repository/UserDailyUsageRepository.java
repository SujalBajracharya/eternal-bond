package com.eternalbond.api.repository;

import com.eternalbond.api.model.UserDailyUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserDailyUsageRepository extends JpaRepository<UserDailyUsage, UUID> {

    Optional<UserDailyUsage> findByUserIdAndUsageDate(String userId, LocalDate date);

    /**
     * Atomically increment the likes_used counter for today.
     */
    @Modifying
    @Query("""
        UPDATE UserDailyUsage u
        SET u.likesUsed = u.likesUsed + 1
        WHERE u.userId = :userId AND u.usageDate = :date
        """)
    void incrementLikesUsed(@Param("userId") String userId, @Param("date") LocalDate date);

    /**
     * Atomically increment the reveals_used counter for today.
     */
    @Modifying
    @Query("""
        UPDATE UserDailyUsage u
        SET u.revealsUsed = u.revealsUsed + 1
        WHERE u.userId = :userId AND u.usageDate = :date
        """)
    void incrementRevealsUsed(@Param("userId") String userId, @Param("date") LocalDate date);

        /** Atomically consumes one free reveal only while the daily allowance remains. */
        @Modifying
        @Query("""
                UPDATE UserDailyUsage u
                SET u.revealsUsed = u.revealsUsed + 1
                WHERE u.userId = :userId
                    AND u.usageDate = :date
                    AND u.revealsUsed < :dailyLimit
                """)
        int incrementRevealsUsedIfAvailable(
                        @Param("userId") String userId,
                        @Param("date") LocalDate date,
                        @Param("dailyLimit") int dailyLimit
        );

    /**
     * Mark that the user has purchased an extra like today (once-per-day gate).
     */
    @Modifying
    @Query("""
        UPDATE UserDailyUsage u
        SET u.extraLikePurchased = true
        WHERE u.userId = :userId AND u.usageDate = :date
        """)
    void markExtraLikePurchased(@Param("userId") String userId, @Param("date") LocalDate date);

    /**
     * Mark that the user has purchased a reveal today (once-per-day gate).
     */
    @Modifying
    @Query("""
        UPDATE UserDailyUsage u
        SET u.revealPurchased = true
        WHERE u.userId = :userId AND u.usageDate = :date
        """)
    void markRevealPurchased(@Param("userId") String userId, @Param("date") LocalDate date);
}
