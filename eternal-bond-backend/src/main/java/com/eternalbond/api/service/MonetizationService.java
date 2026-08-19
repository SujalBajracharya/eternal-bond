package com.eternalbond.api.service;

import com.eternalbond.api.dto.CheckoutRequest;
import com.eternalbond.api.dto.CheckoutResponse;
import com.eternalbond.api.dto.EntitlementResponse;
import com.eternalbond.api.exception.PaymentProcessingException;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.EntitlementKey;
import com.eternalbond.api.model.Match;
import com.eternalbond.api.model.Payment;
import com.eternalbond.api.model.PaymentStatus;
import com.eternalbond.api.model.ProductCatalog;
import com.eternalbond.api.model.UserEntitlement;
import com.eternalbond.api.model.UserNotification;
import com.eternalbond.api.repository.MatchRepository;
import com.eternalbond.api.repository.PaymentRepository;
import com.eternalbond.api.repository.ProductCatalogRepository;
import com.eternalbond.api.repository.UserNotificationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Orchestrates the full monetization lifecycle:
 * 1. Checkout initiation (frontend sends productId → backend creates PaymentIntent)
 * 2. Webhook processing (Stripe confirms payment → backend grants entitlement)
 * 3. Entitlement queries (frontend fetches current permissions)
 *
 * Prices are NEVER sent from the frontend. All amounts are resolved here.
 */
@Service
@Transactional
public class MonetizationService {

    private static final Logger log = LoggerFactory.getLogger(MonetizationService.class);

    private final ProductCatalogRepository  productCatalogRepo;
    private final PaymentRepository         paymentRepository;
    private final EntitlementService        entitlementService;
    private final MatchRepository           matchRepository;
    private final UserNotificationRepository notificationRepository;
    private final ObjectMapper              objectMapper;
    private final String                    webhookSigningSecret;

    public MonetizationService(
            ProductCatalogRepository productCatalogRepo,
            PaymentRepository paymentRepository,
            EntitlementService entitlementService,
            MatchRepository matchRepository,
            UserNotificationRepository notificationRepository,
            ObjectMapper objectMapper,
            @Value("${stripe.webhook-secret:}") String webhookSigningSecret) {
        this.productCatalogRepo   = productCatalogRepo;
        this.paymentRepository    = paymentRepository;
        this.entitlementService   = entitlementService;
        this.matchRepository      = matchRepository;
        this.notificationRepository = notificationRepository;
        this.objectMapper         = objectMapper;
        this.webhookSigningSecret = webhookSigningSecret;
    }

    // ── Checkout ──────────────────────────────────────────────────────────────

    /**
     * Initiates a purchase by creating a Stripe PaymentIntent.
     * The amount is resolved from the product catalog — the frontend cannot override it.
     */
    public CheckoutResponse initiateCheckout(CheckoutRequest request) {
        String userId = resolveAuthenticatedUserId();

        ProductCatalog product = productCatalogRepo.findByIdAndIsActiveTrue(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product not found or not available: " + request.getProductId()));

        // Validate once-per-day purchase gates BEFORE creating the Stripe intent
        validateDailyPurchaseGate(userId, product);

        // Convert NPR to paisa (100 paisa = 1 NPR) for Stripe
        long amountPaisa = (long) product.getAmountNpr() * 100;

        // Build metadata that will be attached to the PaymentIntent (carried through webhooks)
        Map<String, String> stripeMetadata = buildStripeMetadata(userId, product, request.getContext());

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountPaisa)
                    .setCurrency("npr")
                    .setDescription(product.getDescription())
                    .putAllMetadata(stripeMetadata)
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params,
                    RequestOptions.builder().build());

            // Persist a PENDING payment record immediately
            String contextJson = serializeContext(request.getContext());
            Payment payment = Payment.builder()
                    .userId(userId)
                    .stripePaymentIntentId(paymentIntent.getId())
                    .amount(amountPaisa)
                    .currency("NPR")
                    .status(PaymentStatus.PENDING)
                    .description(product.getDescription())
                    .productId(product.getId())
                    .metadata(contextJson)
                    .build();
            payment = paymentRepository.save(payment);

            log.info("Created PaymentIntent {} for user {} product {}",
                    paymentIntent.getId(), userId, product.getId());

            return CheckoutResponse.builder()
                    .clientSecret(paymentIntent.getClientSecret())
                    .paymentId(payment.getId())
                    .amountNpr(product.getAmountNpr())
                    .productName(product.getName())
                    .build();

        } catch (StripeException ex) {
            log.error("Stripe PaymentIntent creation failed for user {} product {}",
                    userId, product.getId(), ex);
            throw new PaymentProcessingException("Unable to initiate checkout", ex);
        }
    }

    // ── Webhook ───────────────────────────────────────────────────────────────

    /**
     * Handles incoming Stripe webhooks.
     * Entitlements are ONLY granted here, after payment is confirmed by Stripe.
     */
    public void handleWebhook(String payload, String signatureHeader) {
        if (!StringUtils.hasText(webhookSigningSecret)) {
            throw new IllegalStateException("Stripe webhook signing secret is not configured");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, webhookSigningSecret);
        } catch (SignatureVerificationException ex) {
            log.warn("Invalid Stripe webhook signature", ex);
            throw new AccessDeniedException("Invalid Stripe webhook signature");
        } catch (Exception ex) {
            log.error("Webhook parsing failed", ex);
            throw new PaymentProcessingException("Failed to parse Stripe webhook", ex);
        }

        log.info("Processing Stripe webhook event: {}", event.getType());

        switch (event.getType()) {
            case "checkout.session.completed"   -> handleCheckoutSessionCompleted(event);
            case "checkout.session.async_payment_succeeded" -> handleCheckoutSessionCompleted(event);
            case "payment_intent.succeeded"       -> handlePaymentSucceeded(event);
            case "payment_intent.payment_failed"  -> handlePaymentFailed(event);
            default -> log.debug("Ignoring webhook event type: {}", event.getType());
        }
    }

    // ── Entitlements ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public EntitlementResponse getEntitlements() {
        String userId = resolveAuthenticatedUserId();
        return entitlementService.getEntitlements(userId);
    }

    /** Consumes the authenticated user's daily free Reveal Like allowance. */
    public EntitlementResponse consumeFreeReveal() {
        return entitlementService.consumeFreeReveal(resolveAuthenticatedUserId());
    }

    /** Activates one available recurring Profile Boost for the authenticated user. */
    public EntitlementResponse activateProfileBoost() {
        return entitlementService.activateProfileBoost(resolveAuthenticatedUserId());
    }

    /**
     * Marks a single-use entitlement as consumed.
     * Called by the frontend after the user actually uses the purchased action.
     */
    public void consumeEntitlement(String entitlementKeyStr) {
        String userId = resolveAuthenticatedUserId();
        EntitlementKey key;
        try {
            key = EntitlementKey.valueOf(entitlementKeyStr);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Unknown entitlement key: " + entitlementKeyStr);
        }
        entitlementService.consumeEntitlement(userId, key);
    }

    /**
     * Consumes one extend_chat entitlement to extend the chat expiration by 24 hours.
     */
    public LocalDateTime extendChat(String matchId) {
        String userId = resolveAuthenticatedUserId();
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found: " + matchId));

        if (!match.getUserOne().getId().equals(userId) && !match.getUserTwo().getId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized to extend this chat");
        }

        boolean eitherPremium = entitlementService.hasActivePremium(match.getUserOne().getId())
                || entitlementService.hasActivePremium(match.getUserTwo().getId());
        if (eitherPremium) {
            match.setExpiresAt(null);
            matchRepository.save(match);
            return null;
        }

        entitlementService.consumeEntitlement(userId, EntitlementKey.extend_chat);

        LocalDateTime currentExpiry = match.getExpiresAt();
        LocalDateTime newExpiry;
        if (currentExpiry == null || currentExpiry.isBefore(LocalDateTime.now())) {
            newExpiry = LocalDateTime.now().plusHours(24);
        } else {
            newExpiry = currentExpiry.plusHours(24);
        }

        match.setExpiresAt(newExpiry);
        matchRepository.save(match);
        log.info("Chat match {} extended by 24h by user {}. New expiry: {}", matchId, userId, newExpiry);
        return newExpiry;
    }

    /**
     * Development/Sandbox helper to simulate a successful payment and grant entitlements
     * without needing to configure or receive external Stripe webhooks.
     */
    public void simulatePaymentSuccess(String paymentIntentId) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for intent: " + paymentIntentId));

        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment = paymentRepository.save(payment);

        LocalDateTime expiresAt = resolveEntitlementExpiry(payment.getProductId());

        entitlementService.grantEntitlement(
                payment.getUserId(),
                payment.getProductId(),
                payment.getId(),
                expiresAt,
                new HashMap<>()
        );
        log.info("Simulated payment success for payment {} and granted entitlement", payment.getId());

        saveNotification(payment.getUserId(), payment.getProductId(), payment.getAmount(), payment.getId());
    }

    // ── Private: Webhook Handlers ─────────────────────────────────────────────

    private void handlePaymentSucceeded(Event event) {
        PaymentIntent paymentIntent = deserializePaymentIntent(event);
        String paymentIntentId      = paymentIntent.getId();
        Map<String, String> meta    = paymentIntent.getMetadata();

        String userId    = meta != null ? meta.get("userId") : null;
        String productId = meta != null ? meta.get("productId") : null;

        if (!StringUtils.hasText(userId) || !StringUtils.hasText(productId)) {
            log.error("PaymentIntent {} succeeded but missing userId or productId in metadata",
                    paymentIntentId);
            return;
        }

        // Update payment record status
        Payment payment = paymentRepository.findByStripePaymentIntentId(paymentIntentId)
                .orElseGet(() -> {
                    log.warn("No payment record found for PaymentIntent {}; creating one", paymentIntentId);
                    return Payment.builder()
                            .userId(userId)
                            .stripePaymentIntentId(paymentIntentId)
                            .amount(paymentIntent.getAmount())
                            .currency("NPR")
                            .status(PaymentStatus.PENDING)
                            .productId(productId)
                            .build();
                });

        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment = paymentRepository.save(payment);

        // Calculate expiry based on product type
        LocalDateTime expiresAt = resolveEntitlementExpiry(productId);

        // Parse context metadata (e.g. conversationId for extend_chat)
        Map<String, String> contextMeta = new HashMap<>();
        String contextJson = meta.get("context");
        if (StringUtils.hasText(contextJson)) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, String> parsed = objectMapper.readValue(contextJson, Map.class);
                contextMeta.putAll(parsed);
            } catch (JsonProcessingException ex) {
                log.warn("Failed to parse context metadata from PaymentIntent", ex);
            }
        }

        // Grant the entitlement — idempotent (safe to replay)
        UserEntitlement granted = entitlementService.grantEntitlement(
                userId, productId, payment.getId(), expiresAt, contextMeta);

        log.info("Entitlement {} granted to user {} after payment {} succeeded",
                granted.getEntitlementKey(), userId, payment.getId());

        saveNotification(userId, productId, payment.getAmount(), payment.getId());
    }

    /**
     * Checkout Sessions retain the server-side user and product metadata. This
     * handler is the source of truth for Checkout completion and is idempotent
     * through the unique Stripe payment/session identifier and entitlement
     * payment ID.
     */
    private void handleCheckoutSessionCompleted(Event event) {
        Session checkoutSession = deserializeObject(event, Session.class);
        if (checkoutSession == null) {
            log.error("[WEBHOOK] Could not deserialize Checkout Session from event {}. " +
                    "SDK/API version mismatch? Raw data: {}", event.getId(), event.getData().toJson());
            return;
        }

        if (!"paid".equalsIgnoreCase(checkoutSession.getPaymentStatus())) {
            log.info("Checkout Session {} completed without a paid status; awaiting payment confirmation",
                    checkoutSession.getId());
            return;
        }

        Map<String, String> metadata = checkoutSession.getMetadata();
        String userId = metadata != null ? metadata.get("userId") : null;
        if (!StringUtils.hasText(userId)) {
            userId = checkoutSession.getClientReferenceId();
        }

        String productId = metadata != null ? metadata.get("productId") : null;

        if (!StringUtils.hasText(userId) || !StringUtils.hasText(productId)) {
            log.error("Checkout Session {} is missing userId ({}) or productId ({}) metadata",
                    checkoutSession.getId(), userId, productId);
            return;
        }

        String stripePaymentId = StringUtils.hasText(checkoutSession.getPaymentIntent())
                ? checkoutSession.getPaymentIntent()
                : "checkout_" + checkoutSession.getId();
        
        final String finalUserId = userId;
        final String finalProductId = productId;
        Payment payment = paymentRepository.findByStripePaymentIntentId(stripePaymentId)
                .orElseGet(() -> Payment.builder()
                        .userId(finalUserId)
                        .stripePaymentIntentId(stripePaymentId)
                        .amount(checkoutSession.getAmountTotal())
                        .currency(checkoutSession.getCurrency() != null ? checkoutSession.getCurrency().toUpperCase() : "NPR")
                        .status(PaymentStatus.PENDING)
                        .productId(finalProductId)
                        .build());

        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment = paymentRepository.save(payment);
        entitlementService.grantEntitlement(
                userId,
                productId,
                payment.getId(),
                resolveEntitlementExpiry(productId),
                new HashMap<>()
        );
        log.info("Checkout Session {} completed; entitlement granted for user {}", checkoutSession.getId(), userId);

        saveNotification(userId, productId, checkoutSession.getAmountTotal(), payment.getId());
    }

    private void handlePaymentFailed(Event event) {
        PaymentIntent paymentIntent = deserializePaymentIntent(event);
        paymentRepository.findByStripePaymentIntentId(paymentIntent.getId())
                .ifPresent(p -> {
                    p.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(p);
                    log.info("Payment {} marked FAILED", p.getId());
                });
    }

    // ── Private: Helpers ──────────────────────────────────────────────────────

    /**
     * Persists a purchase notification for the user's Notifications page.
     */
    private void saveNotification(String userId, String productId, Long amountPaisa, String transactionId) {
        if (!StringUtils.hasText(userId) || !StringUtils.hasText(productId)) {
            log.warn("Cannot save notification: missing userId ({}) or productId ({})", userId, productId);
            return;
        }
        long amount = amountPaisa != null ? amountPaisa : 0L;
        String[] info = notificationDetails(productId);
        String title  = info[0];
        String body   = info[1] + (amount > 0 ? String.format(" (NPR %.2f)", amount / 100.0) : "");
        try {
            notificationRepository.save(
                UserNotification.builder()
                    .userId(userId)
                    .transactionId(transactionId)
                    .type("purchase")
                    .title(title)
                    .body(body)
                    .metadata(Map.of("product_id", productId, "amount_paisa", String.valueOf(amount)))
                    .build()
            );
            log.info("Saved purchase notification for user {} product {}", userId, productId);
        } catch (Exception ex) {
            log.error("Failed to save purchase notification for user {} product {}: {}",
                    userId, productId, ex.getMessage(), ex);
        }
    }

    /** Returns [title, bodyPrefix] for a given product ID. */
    private static String[] notificationDetails(String productId) {
        return switch (productId) {
            case "undo_skip"       -> new String[]{"⏪ Undo Skip activated",
                    "Your Undo Skip was successful. The skipped profile has been restored to your today's list."};
            case "extra_like"      -> new String[]{"❤️ Extra Introductions added",
                    "3 extra curated matches have been added to your Today's list."};
            case "reveal_like"     -> new String[]{"👁️ Like Reveal purchased",
                    "Your purchase unlocks one admirer reveal. Visit your Likes tab to see who it is."};
                case "priority_interest" -> new String[]{"✨ Priority Interest ready",
                    "Your Priority Interest is ready to send from Daily Matches."};
            case "extend_chat"     -> new String[]{"💬 Chat Extended",
                    "Your conversation has been extended by 7 days. Keep the connection going!"};
            case "profile_boost"   -> new String[]{"🚀 Profile Boost active",
                    "Your profile is now boosted for 24 hours. Expect 3× more profile views!"};
            case "premium_monthly" -> new String[]{"✨ Premium activated",
                    "Welcome to EternalBond Premium! Enjoy unlimited reveals, undo skips, advanced filters and more for 30 days."};
            case "premium_yearly"  -> new String[]{"✨ Premium activated (Yearly)",
                    "Welcome to EternalBond Premium! Your annual plan is now active — enjoy all premium features for 12 months."};
            default                -> new String[]{"✅ Purchase confirmed",
                    "Your purchase was successful. Your new feature is now available."};
        };
    }

    /**
     * Validates that once-per-day products are not being purchased twice today.
     */
    private void validateDailyPurchaseGate(String userId, ProductCatalog product) {
        if (product.getDailyLimit() == null) return;
        var usage = entitlementService.getOrCreateTodayUsage(userId);
        switch (product.getId()) {
            case "extra_like" -> {
                if (usage.isExtraLikePurchased()) {
                    throw new com.eternalbond.api.exception.LimitExceededException(
                            "Extra like can only be purchased once per day.");
                }
            }
            case "reveal_like" -> {
                if (usage.isRevealPurchased()) {
                    throw new com.eternalbond.api.exception.LimitExceededException(
                            "A paid reveal can only be purchased once per day.");
                }
            }
        }
    }

    private Map<String, String> buildStripeMetadata(
            String userId, ProductCatalog product, Map<String, String> context) {
        Map<String, String> meta = new HashMap<>();
        meta.put("userId",    userId);
        meta.put("productId", product.getId());
        if (context != null && !context.isEmpty()) {
            try {
                meta.put("context", objectMapper.writeValueAsString(context));
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize context for Stripe metadata", e);
            }
        }
        return meta;
    }

    private LocalDateTime resolveEntitlementExpiry(String productId) {
        return switch (productId) {
            case "premium_monthly" -> LocalDateTime.now().plusMonths(1);
            case "premium_yearly"  -> LocalDateTime.now().plusYears(1);
            case "profile_boost"   -> LocalDateTime.now().plusHours(24);
            // Single-use entitlements: no expiry (consumed on use)
            default                -> null;
        };
    }

    private PaymentIntent deserializePaymentIntent(Event event) {
        PaymentIntent intent = deserializeObject(event, PaymentIntent.class);
        if (intent == null) {
            log.error("[WEBHOOK] Could not deserialize PaymentIntent from event {}. " +
                    "SDK/API version mismatch? Raw data: {}", event.getId(), event.getData().toJson());
            throw new PaymentProcessingException(
                    "Failed to deserialize PaymentIntent from event " + event.getId());
        }
        return intent;
    }

    /**
     * Deserializes a Stripe event's data object using the typed SDK deserializer first,
     * then falls back to raw JSON parsing via Gson (bundled with stripe-java).
     * This makes the code resilient to minor SDK/API version skew.
     */
    @SuppressWarnings("unchecked")
    private <T extends StripeObject> T deserializeObject(Event event, Class<T> type) {
        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        if (deserializer.getObject().isPresent()) {
            return type.cast(deserializer.getObject().get());
        }
        // Fallback: use Gson (bundled with stripe-java) to parse the raw JSON
        try {
            com.google.gson.Gson gson = new com.google.gson.Gson();
            String rawJson = event.getData().toJson();
            return gson.fromJson(rawJson, type);
        } catch (Exception ex) {
            log.warn("Raw JSON fallback deserialization also failed for event {}: {}",
                    event.getId(), ex.getMessage());
            return null;
        }
    }

    private String serializeContext(Map<String, String> context) {
        if (context == null || context.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(context);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private String resolveAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new AccessDeniedException("Authentication required");
        }
        return auth.getPrincipal().toString();
    }
}
