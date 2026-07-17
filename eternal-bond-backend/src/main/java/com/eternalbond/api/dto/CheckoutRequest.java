package com.eternalbond.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.Map;

/**
 * Request sent by the frontend to initiate a purchase.
 * The frontend sends ONLY a product identifier — never a price.
 * The backend resolves the price from the product catalog.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {

    /**
     * The product identifier as defined in the product_catalog table.
     * e.g. "extra_like", "premium_monthly", "undo_skip"
     */
    @NotBlank(message = "Product ID is required")
    private String productId;

    /**
     * Optional contextual metadata for certain products.
     * For extend_chat: { "conversationId": "..." }
     */
    private Map<String, String> context;
}
