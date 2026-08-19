package com.eternalbond.api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Records a granted entitlement for a user.
 * This is the central table consulted by EntitlementService to answer
 * "can this user do X?" — regardless of whether the entitlement came
 * from a subscription or a pay-per-action purchase.
 */
@Entity
@Table(name = "user_entitlements", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntitlement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    /**
     * Which entitlement is granted.
     * Stored as varchar in DB matching the entitlement_key PG enum.
     */
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "entitlement_key", columnDefinition = "entitlement_key")
    private EntitlementKey entitlementKey;

    /**
     * Which product in the catalog granted this entitlement.
     */
    @Column(name = "granted_by_product", length = 64)
    private String grantedByProduct;

    /**
     * Reference to the payment that funded this entitlement.
     * Nullable — admin-granted entitlements won't have a payment.
     */
    @Column(name = "payment_id", length = 64)
    private String paymentId;

    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt;

    /**
     * Null means the entitlement does not expire (e.g. admin grants).
     * Set for subscriptions and time-limited boosts.
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * True once a single-use entitlement has been consumed.
     * For example, an extra_like entitlement is consumed when the like is sent.
     */
    @Column(name = "is_consumed", nullable = false)
    @Builder.Default
    private boolean consumed = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    /**
     * Optional structured metadata. For extend_chat this holds { "conversation_id": "..." }.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String metadata;

    /** Period key used by recurring grants, for example 2026-W34 or 2026-08-1. */
    @Column(name = "grant_period", length = 32)
    private String grantPeriod;

    /** Category used to keep weekly and yearly monthly boosts independent. */
    @Column(name = "grant_type", length = 32)
    private String grantType;

    /** Set when a recurring Profile Boost is activated by the user. */
    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (grantedAt == null) grantedAt = LocalDateTime.now();
    }
}
