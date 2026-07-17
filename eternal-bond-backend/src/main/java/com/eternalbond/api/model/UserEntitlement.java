package com.eternalbond.api.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

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
    private String id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    /**
     * Which entitlement is granted.
     * Stored as varchar in DB matching the entitlement_key PG enum.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "entitlement_key", nullable = false, length = 32)
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

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (grantedAt == null) grantedAt = LocalDateTime.now();
    }
}
