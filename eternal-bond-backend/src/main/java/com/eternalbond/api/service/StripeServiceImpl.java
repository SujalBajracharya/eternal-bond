package com.eternalbond.api.service;

import com.eternalbond.api.dto.PaymentDetailsDto;
import com.eternalbond.api.dto.PaymentRequest;
import com.eternalbond.api.dto.PaymentResponse;
import com.eternalbond.api.dto.PaymentSummaryDto;
import com.eternalbond.api.dto.RefundRequest;
import com.eternalbond.api.dto.RefundResponse;
import com.eternalbond.api.exception.PaymentProcessingException;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.exception.StripePaymentException;
import com.eternalbond.api.model.Payment;
import com.eternalbond.api.model.PaymentStatus;
import com.eternalbond.api.repository.PaymentRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Charge;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StripeServiceImpl implements StripeService {

    private static final Logger log = LoggerFactory.getLogger(StripeServiceImpl.class);

    private final PaymentRepository paymentRepository;
    private final String webhookSigningSecret;

    public StripeServiceImpl(
            PaymentRepository paymentRepository,
            @Value("${stripe.webhook-secret:}") String webhookSigningSecret) {
        this.paymentRepository = paymentRepository;
        this.webhookSigningSecret = webhookSigningSecret;
    }

    @Override
    public PaymentResponse createPaymentIntent(PaymentRequest request) {
        String userId = resolveAuthenticatedUserId();
        String idempotencyKey = buildIdempotencyKey(userId, request);

        log.info("Creating Stripe payment intent for user {} with idempotency key {}", userId, idempotencyKey);

        try {
            PaymentIntentCreateParams params = buildPaymentIntentCreateParams(request);
            RequestOptions requestOptions = RequestOptions.builder()
                    .setIdempotencyKey(idempotencyKey)
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params, requestOptions);

            return paymentRepository.findByStripePaymentIntentId(paymentIntent.getId())
                    .map(existingPayment -> {
                        log.info("Reusing existing payment record for payment intent {}", paymentIntent.getId());
                        return buildPaymentResponse(paymentIntent);
                    })
                    .orElseGet(() -> {
                        Payment payment = Payment.builder()
                                .userId(userId)
                                .stripePaymentIntentId(paymentIntent.getId())
                                .amount(paymentIntent.getAmount())
                                .currency(paymentIntent.getCurrency().toUpperCase())
                                .status(PaymentStatus.PENDING)
                                .description(request.getDescription())
                                .build();

                        paymentRepository.save(payment);
                        log.info("Stored payment record for payment intent {}", paymentIntent.getId());
                        return buildPaymentResponse(paymentIntent);
                    });
        } catch (StripeException ex) {
            log.error("Stripe payment intent creation failed for user {}", userId, ex);
            throw new PaymentProcessingException("Unable to create Stripe payment intent", ex);
        }
    }

    @Override
    public Page<PaymentSummaryDto> getPayments(Pageable pageable) {
        String userId = resolveAuthenticatedUserId();
        return paymentRepository.findAllByUserId(userId, pageable)
                .map(PaymentSummaryDto::fromEntity);
    }

    @Override
    public PaymentDetailsDto getPaymentById(String paymentId) {
        String userId = resolveAuthenticatedUserId();
        Payment payment = paymentRepository.findByIdAndUserId(paymentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        return PaymentDetailsDto.fromEntity(payment);
    }

    @Override
    @Transactional
    public RefundResponse refundPayment(String paymentId, RefundRequest request) {
        String userId = resolveAuthenticatedUserId();

        Payment payment = paymentRepository.findByIdAndUserId(paymentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new StripePaymentException("Payment has already been fully refunded");
        }

        if (payment.getStatus() != PaymentStatus.SUCCEEDED && payment.getStatus() != PaymentStatus.PARTIALLY_REFUNDED) {
            throw new StripePaymentException("Only successful payments can be refunded");
        }

        log.info("Processing refund for payment {} by user {}", paymentId, userId);

        try {
            long refundAmount = request.getAmount() != null ? request.getAmount() : payment.getAmount();
            long alreadyRefunded = payment.getRefundedAmount() != null ? payment.getRefundedAmount() : 0L;
            long remainingAmount = payment.getAmount() - alreadyRefunded;

            if (refundAmount <= 0) {
                throw new StripePaymentException("Refund amount must be greater than zero");
            }

            if (refundAmount > remainingAmount) {
                throw new StripePaymentException("Refund amount cannot exceed the remaining refundable amount");
            }

            RefundCreateParams refundParams = RefundCreateParams.builder()
                    .setPaymentIntent(payment.getStripePaymentIntentId())
                    .setAmount(refundAmount)
                    .setReason(resolveRefundReason(request.getReason()))
                    .build();

            Refund refund = Refund.create(refundParams, RequestOptions.builder().build());

            PaymentStatus nextStatus = refundAmount >= remainingAmount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
            payment.setStatus(nextStatus);
            payment.setRefundedAmount(alreadyRefunded + refundAmount);
            payment.setRefundId(refund.getId());
            payment.setRefundReason(request.getReason() != null ? request.getReason() : "requested_by_customer");
            payment.setRefundedAt(java.time.LocalDateTime.now());
            paymentRepository.save(payment);

            log.info("Stripe refund created for payment {} with refund id {}", payment.getId(), refund.getId());

            return RefundResponse.builder()
                    .paymentId(payment.getId())
                    .refundId(refund.getId())
                    .amount(refund.getAmount())
                    .status(nextStatus)
                    .message(refundAmount >= remainingAmount ? "Payment refunded successfully" : "Partial refund initiated")
                    .build();
        } catch (StripeException ex) {
            log.error("Stripe refund failed for payment {}", payment.getId(), ex);
            throw new PaymentProcessingException("Unable to refund Stripe payment", ex);
        }
    }

    @Override
    @Transactional
    public String handleWebhook(String payload, String signatureHeader) {
        if (!StringUtils.hasText(signatureHeader)) {
            throw new StripePaymentException("Missing Stripe signature header");
        }

        if (!StringUtils.hasText(webhookSigningSecret)) {
            throw new StripePaymentException("Stripe webhook signing secret is not configured");
        }

        try {
            Event event = Webhook.constructEvent(payload, signatureHeader, webhookSigningSecret);
            log.info("Received Stripe webhook event: {}", event.getType());

            switch (event.getType()) {
                case "payment_intent.succeeded" -> handlePaymentIntentSucceeded(event);
                case "payment_intent.payment_failed" -> handlePaymentIntentFailed(event);
                case "charge.refunded" -> handleChargeRefunded(event);
                default -> log.info("Ignoring unsupported Stripe webhook event: {}", event.getType());
            }

            return "Webhook processed successfully";
        } catch (SignatureVerificationException ex) {
            log.warn("Invalid Stripe signature received for webhook", ex);
            throw new StripePaymentException("Invalid Stripe signature", ex);
        } catch (StripeException ex) {
            log.error("Stripe webhook processing failed", ex);
            throw new StripePaymentException("Unable to process Stripe webhook", ex);
        }
    }

    private void handlePaymentIntentSucceeded(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new StripePaymentException("Unable to deserialize payment intent event"));

        updatePaymentStatus(paymentIntent.getId(), PaymentStatus.SUCCEEDED);
    }

    private void handlePaymentIntentFailed(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new StripePaymentException("Unable to deserialize payment intent event"));

        updatePaymentStatus(paymentIntent.getId(), PaymentStatus.FAILED);
    }

    private void handleChargeRefunded(Event event) {
        Charge charge = (Charge) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new StripePaymentException("Unable to deserialize charge event"));

        String paymentIntentId = charge.getPaymentIntent();
        if (!StringUtils.hasText(paymentIntentId)) {
            throw new StripePaymentException("Refunded charge did not include a payment intent reference");
        }

        updatePaymentStatus(paymentIntentId, PaymentStatus.REFUNDED);
    }

    private void updatePaymentStatus(String paymentIntentId, PaymentStatus status) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new StripePaymentException("Payment record not found for Stripe payment intent: " + paymentIntentId));
        payment.setStatus(status);
        paymentRepository.save(payment);
        log.info("Updated payment {} status to {}", payment.getId(), status);
    }

    private RefundCreateParams.Reason resolveRefundReason(String reason) {
        if (!StringUtils.hasText(reason)) {
            return RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER;
        }

        return switch (reason.toLowerCase()) {
            case "duplicate" -> RefundCreateParams.Reason.DUPLICATE;
            case "fraudulent" -> RefundCreateParams.Reason.FRAUDULENT;
            default -> RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER;
        };
    }

    private PaymentIntentCreateParams buildPaymentIntentCreateParams(PaymentRequest request) {
        PaymentIntentCreateParams.Builder builder = PaymentIntentCreateParams.builder()
                .setAmount(request.getAmount())
                .setCurrency(request.getCurrency().toLowerCase())
                .setDescription(request.getDescription())
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                );

        if (request.getMetadata() != null && !request.getMetadata().isEmpty()) {
            builder.putAllMetadata(request.getMetadata());
        }

        return builder.build();
    }

    private PaymentResponse buildPaymentResponse(PaymentIntent paymentIntent) {
        return PaymentResponse.builder()
                .paymentIntentId(paymentIntent.getId())
                .clientSecret(paymentIntent.getClientSecret())
                .amount(paymentIntent.getAmount())
                .currency(paymentIntent.getCurrency())
                .status(paymentIntent.getStatus())
                .build();
    }

    private String buildIdempotencyKey(String userId, PaymentRequest request) {
        String fingerprint = String.join("|",
                userId,
                String.valueOf(request.getAmount()),
                request.getCurrency().toLowerCase(),
                StringUtils.hasText(request.getDescription()) ? request.getDescription() : "",
                request.getMetadata() == null ? "" : request.getMetadata().entrySet().stream()
                        .sorted(Comparator.comparing(Map.Entry::getKey))
                        .map(entry -> entry.getKey() + "=" + entry.getValue())
                        .collect(Collectors.joining(","))
        );

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(fingerprint.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return "payment-intent-" + hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", ex);
        }
    }

    private String resolveAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null) {
            throw new AccessDeniedException("Authentication is required to create a payment");
        }

        return authentication.getPrincipal().toString();
    }
}
