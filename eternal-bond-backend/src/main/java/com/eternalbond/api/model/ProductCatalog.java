package com.eternalbond.api.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Mirrors the product_catalog table.
 * The backend uses this to map a frontend product identifier to a Stripe price ID.
 * The frontend NEVER sends prices — it sends a productId string only.
 */
@Entity
@Table(name = "product_catalog", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductCatalog {

    @Id
    @Column(nullable = false, length = 64)
    private String id;  // e.g. "extra_like", "premium_monthly"

    @Column(nullable = false, length = 128)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * "one_time" or "subscription"
     */
    @Column(nullable = false, length = 20)
    private String type;

    /**
     * Stripe Price ID. Configured via admin or environment.
     * This field MUST be set before live payments can be processed.
     */
    @Column(name = "stripe_price_id", length = 128)
    private String stripePriceId;

    /**
     * Display price in Nepalese Rupee (NPR).
     * This is the amount charged in NPR paisa (i.e. multiply by 100 for Stripe).
     */
    @Column(name = "amount_npr", nullable = false)
    private Integer amountNpr;

    /**
     * If non-null, this product can only be purchased at most this many times per day.
     * e.g. extra_like and reveal_like have a daily_limit of 1.
     */
    @Column(name = "daily_limit")
    private Integer dailyLimit;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
