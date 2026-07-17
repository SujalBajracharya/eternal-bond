package com.eternalbond.api.dto;

import lombok.*;

/**
 * Response returned to the frontend after creating a PaymentIntent.
 * Contains only the Stripe client secret — no internal IDs or prices
 * are exposed beyond what Stripe itself needs on the client side.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutResponse {

    /** Stripe PaymentIntent client secret for use with Stripe.js confirmPayment() */
    private String clientSecret;

    /** Our internal payment record ID (for polling/receipt purposes) */
    private String paymentId;

    /** Display amount in NPR (for UI rendering only — Stripe uses the server-set amount) */
    private int amountNpr;

    /** Product name for UI display */
    private String productName;
}
