package com.eternalbond.api.repository;

import com.eternalbond.api.model.EntitlementKey;
import com.eternalbond.api.model.UserEntitlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;

@Repository
public interface UserEntitlementRepository extends JpaRepository<UserEntitlement, UUID> {

    /**
     * Fetch all active, non-expired, non-consumed entitlements for a user and key.
     */
    @Query("""
        SELECT e FROM UserEntitlement e
        WHERE e.userId = :userId
          AND e.entitlementKey = :key
          AND e.active = true
          AND e.consumed = false
          AND (e.expiresAt IS NULL OR e.expiresAt > :now)
        ORDER BY e.grantedAt DESC
        """)
    List<UserEntitlement> findActiveEntitlements(
            @Param("userId") String userId,
            @Param("key") EntitlementKey key,
            @Param("now") LocalDateTime now
    );

    /** Active Profile Boosts, including purchased boosts and activated recurring grants. */
    @Query("""
        SELECT e FROM UserEntitlement e
        WHERE e.userId = :userId
          AND e.entitlementKey = 'profile_boost'
          AND e.active = true
          AND e.consumed = false
          AND (e.activatedAt IS NOT NULL OR e.grantType IS NULL)
          AND (e.expiresAt IS NULL OR e.expiresAt > :now)
        ORDER BY e.grantedAt DESC
        """)
    List<UserEntitlement> findActiveProfileBoosts(
            @Param("userId") String userId,
            @Param("now") LocalDateTime now
    );

    /** Recurring grants that are available but have not been activated. */
    @Query("""
        SELECT e FROM UserEntitlement e
        WHERE e.userId = :userId
          AND e.entitlementKey = 'profile_boost'
          AND e.active = true
          AND e.consumed = false
          AND e.grantType IS NOT NULL
          AND e.activatedAt IS NULL
          AND (e.expiresAt IS NULL OR e.expiresAt > :now)
        ORDER BY e.grantedAt ASC
        """)
    List<UserEntitlement> findAvailableProfileBoosts(
            @Param("userId") String userId,
            @Param("now") LocalDateTime now
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT e FROM UserEntitlement e
        WHERE e.userId = :userId
          AND e.entitlementKey = 'profile_boost'
          AND e.active = true
          AND e.consumed = false
          AND e.grantType IS NOT NULL
          AND e.activatedAt IS NULL
          AND (e.expiresAt IS NULL OR e.expiresAt > :now)
        ORDER BY e.grantedAt ASC
        LIMIT 1
        """)
    Optional<UserEntitlement> findFirstAvailableProfileBoostForUpdate(
            @Param("userId") String userId,
            @Param("now") LocalDateTime now
    );

    /**
     * Check if the user has at least one valid active premium entitlement.
     */
    @Query("""
        SELECT COUNT(e) > 0 FROM UserEntitlement e
        WHERE e.userId = :userId
          AND e.entitlementKey = 'premium_access'
          AND e.active = true
          AND e.consumed = false
          AND (e.expiresAt IS NULL OR e.expiresAt > :now)
        """)
    boolean hasPremiumAccess(@Param("userId") String userId, @Param("now") LocalDateTime now);

    /** Returns active premium users from the supplied candidate set. */
    @Query("""
        SELECT DISTINCT e.userId FROM UserEntitlement e
        WHERE e.userId IN :userIds
          AND e.entitlementKey = 'premium_access'
          AND e.active = true
          AND e.consumed = false
          AND (e.expiresAt IS NULL OR e.expiresAt > :now)
        """)
    List<String> findActivePremiumUserIds(
            @Param("userIds") List<String> userIds,
            @Param("now") LocalDateTime now
    );

        /** Returns every user with at least one active Premium entitlement. */
        @Query("""
      SELECT DISTINCT e.userId FROM UserEntitlement e
      WHERE e.entitlementKey = 'premium_access'
        AND e.active = true
        AND e.consumed = false
        AND (e.expiresAt IS NULL OR e.expiresAt > :now)
      """)
        List<String> findAllActivePremiumUserIds(@Param("now") LocalDateTime now);

        boolean existsByUserIdAndEntitlementKeyAndGrantTypeAndGrantPeriod(
          String userId, EntitlementKey entitlementKey, String grantType, String grantPeriod);

    /**
     * Fetch the first (most recently granted) unconsumed entitlement for a user and key.
     * Used for single-use entitlements.
     */
    @Query("""
        SELECT e FROM UserEntitlement e
        WHERE e.userId = :userId
          AND e.entitlementKey = :key
          AND e.active = true
          AND e.consumed = false
          AND (e.expiresAt IS NULL OR e.expiresAt > :now)
        ORDER BY e.grantedAt DESC
        LIMIT 1
        """)
    Optional<UserEntitlement> findFirstUnconsumed(
            @Param("userId") String userId,
            @Param("key") EntitlementKey key,
            @Param("now") LocalDateTime now
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT e FROM UserEntitlement e
        WHERE e.userId = :userId
          AND e.entitlementKey = :key
          AND e.active = true
          AND e.consumed = false
          AND (e.expiresAt IS NULL OR e.expiresAt > :now)
        ORDER BY e.grantedAt ASC
        LIMIT 1
        """)
    Optional<UserEntitlement> findFirstUnconsumedForUpdate(
            @Param("userId") String userId,
            @Param("key") EntitlementKey key,
            @Param("now") LocalDateTime now
    );

    @Query("""
        SELECT COUNT(e) FROM UserEntitlement e
        WHERE e.userId = :userId
          AND e.entitlementKey = :key
          AND e.active = true
          AND e.consumed = false
          AND (e.expiresAt IS NULL OR e.expiresAt > :now)
        """)
    long countAvailableEntitlements(
            @Param("userId") String userId,
            @Param("key") EntitlementKey key,
            @Param("now") LocalDateTime now
    );

    /**
     * Expire all entitlements whose expiry time has passed.
     * Called by the scheduler.
     */
    @Modifying
    @Query("""
        UPDATE UserEntitlement e
        SET e.active = false
        WHERE e.active = true
          AND e.expiresAt IS NOT NULL
          AND e.expiresAt < :now
        """)
    int expireStaleEntitlements(@Param("now") LocalDateTime now);

    /**
     * Check if the user already has a premium entitlement from a specific payment.
     * Used to prevent duplicate grants on webhook retry.
     */
    boolean existsByPaymentId(String paymentId);

    /**
     * All entitlements for a user, ordered by newest first (for billing display).
     */
    List<UserEntitlement> findAllByUserIdOrderByGrantedAtDesc(String userId);
}
