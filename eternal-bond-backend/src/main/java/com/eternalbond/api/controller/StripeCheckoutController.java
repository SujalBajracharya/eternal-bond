package com.eternalbond.api.controller;

import com.eternalbond.api.dto.CheckoutRequest;
import com.eternalbond.api.service.StripeCheckoutService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class StripeCheckoutController {

    private final StripeCheckoutService stripeCheckoutService;

    public StripeCheckoutController(StripeCheckoutService stripeCheckoutService) {
        this.stripeCheckoutService = stripeCheckoutService;
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<Map<String, String>> createCheckoutSession(
            @Valid @RequestBody CheckoutRequest request) {
        return ResponseEntity.ok(Map.of(
                "checkoutUrl", stripeCheckoutService.createCheckoutSession(request)
        ));
    }
}
