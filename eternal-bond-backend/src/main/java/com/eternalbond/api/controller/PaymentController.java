package com.eternalbond.api.controller;

import com.eternalbond.api.dto.PaymentRequest;
import com.eternalbond.api.dto.PaymentResponse;
import com.eternalbond.api.service.StripeService;
import com.eternalbond.api.dto.PaymentDetailsDto;
import com.eternalbond.api.dto.PaymentSummaryDto;
import com.eternalbond.api.dto.RefundRequest;
import com.eternalbond.api.dto.RefundResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final StripeService stripeService;

    public PaymentController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @GetMapping
    public ResponseEntity<Page<PaymentSummaryDto>> getPayments(Pageable pageable) {
        return ResponseEntity.ok(stripeService.getPayments(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDetailsDto> getPaymentById(@PathVariable String id) {
        return ResponseEntity.ok(stripeService.getPaymentById(id));
    }

    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<RefundResponse> refundPayment(
            @PathVariable String paymentId,
            @Valid @RequestBody RefundRequest request) {
        return ResponseEntity.ok(stripeService.refundPayment(paymentId, request));
    }

    @PostMapping("/create-payment-intent")
    public ResponseEntity<PaymentResponse> createPaymentIntent(@Valid @RequestBody PaymentRequest request) {
        PaymentResponse response = stripeService.createPaymentIntent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signatureHeader) {
        String response = stripeService.handleWebhook(payload, signatureHeader);
        return ResponseEntity.ok(response);
    }
}
