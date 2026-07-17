package com.eternalbond.api.controller;

import com.eternalbond.api.dto.CheckoutRequest;
import com.eternalbond.api.dto.CheckoutResponse;
import com.eternalbond.api.dto.EntitlementResponse;
import com.eternalbond.api.service.MonetizationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for the three-tier monetization system.
 *
 * Endpoints:
 *   POST /api/monetize/checkout         → initiates a purchase (frontend sends productId only)
 *   GET  /api/monetize/entitlements     → returns the full permission snapshot for the current user
 *   POST /api/monetize/consume          → marks a single-use entitlement as consumed
 *   POST /api/monetize/webhook          → Stripe webhook receiver (public — uses signature verification)
 */
@RestController
@RequestMapping("/api/monetize")
public class MonetizationController {

    private final MonetizationService monetizationService;

    public MonetizationController(MonetizationService monetizationService) {
        this.monetizationService = monetizationService;
    }

    /**
     * Initiates a purchase. Frontend sends ONLY the product identifier.
     * Returns a Stripe client secret for use with Stripe.js confirmPayment().
     */
    @PostMapping("/checkout")
    public ResponseEntity<CheckoutResponse> initiateCheckout(
            @Valid @RequestBody CheckoutRequest request) {
        CheckoutResponse response = monetizationService.initiateCheckout(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns the full entitlement snapshot for the authenticated user.
     * The frontend calls this to determine what UI affordances to show.
     */
    @GetMapping("/entitlements")
    public ResponseEntity<EntitlementResponse> getEntitlements() {
        return ResponseEntity.ok(monetizationService.getEntitlements());
    }

    /**
     * Marks a single-use entitlement as consumed.
     * Called by the frontend when the user actually uses an action they purchased
     * (e.g., after sending a like using an extra_like entitlement).
     *
     * Body: { "entitlementKey": "undo_skip" }
     */
    @PostMapping("/consume")
    public ResponseEntity<Map<String, Object>> consumeEntitlement(
            @RequestBody Map<String, String> body) {
        String key = body.get("entitlementKey");
        if (key == null || key.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "entitlementKey is required"));
        }
        monetizationService.consumeEntitlement(key);
        return ResponseEntity.ok(Map.of("success", true, "consumed", key));
    }

    /**
     * Consumes one extend_chat entitlement to extend the chat expiration by 24 hours.
     * Body: { "matchId": "some-match-id" }
     */
    @PostMapping("/extend-chat")
    public ResponseEntity<Map<String, Object>> extendChat(
            @RequestBody Map<String, String> body) {
        String matchId = body.get("matchId");
        if (matchId == null || matchId.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "matchId is required"));
        }
        java.time.LocalDateTime newExpiry = monetizationService.extendChat(matchId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "newExpiry", newExpiry != null ? newExpiry.toString() : "permanent"
        ));
    }

    /**
     * Receives and processes Stripe webhook events.
     * This endpoint is public (no JWT required) — secured by Stripe signature verification.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signatureHeader) {
        monetizationService.handleWebhook(payload, signatureHeader);
        return ResponseEntity.ok("Webhook processed");
    }

    /**
     * Development/Sandbox endpoint to simulate payment intent completion.
     * Body: { "paymentIntentId": "pi_xxx" }
     */
    @PostMapping("/simulate-payment")
    public ResponseEntity<Map<String, Object>> simulatePayment(
            @RequestBody Map<String, String> body) {
        String paymentIntentId = body.get("paymentIntentId");
        if (paymentIntentId == null || paymentIntentId.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "paymentIntentId is required"));
        }
        monetizationService.simulatePaymentSuccess(paymentIntentId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Payment simulated successfully"));
    }
}
