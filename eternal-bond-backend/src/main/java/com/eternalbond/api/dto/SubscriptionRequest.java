package com.eternalbond.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionRequest {

    @NotBlank(message = "Stripe subscription ID is required")
    private String stripeSubscriptionId;

    @NotBlank(message = "Tier is required")
    private String tier; // e.g. "silver", "gold", "platinum"
}
