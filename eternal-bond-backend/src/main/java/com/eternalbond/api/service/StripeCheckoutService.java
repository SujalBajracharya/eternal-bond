package com.eternalbond.api.service;

import com.eternalbond.api.dto.CheckoutRequest;
import com.eternalbond.api.exception.PaymentProcessingException;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.ProductCatalog;
import com.eternalbond.api.repository.ProductCatalogRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/** Creates hosted Stripe Checkout sessions; payment completion stays webhook-driven. */
@Service
public class StripeCheckoutService {

    private final ProductCatalogRepository productCatalogRepository;
    private final String frontendUrl;

    public StripeCheckoutService(
            ProductCatalogRepository productCatalogRepository,
            @Value("${app.frontend.url}") String frontendUrl) {
        this.productCatalogRepository = productCatalogRepository;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    public String createCheckoutSession(CheckoutRequest request) {
        String userId = authenticatedUserId();
        ProductCatalog product = productCatalogRepository.findByIdAndIsActiveTrue(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product not found or not available: " + request.getProductId()));

        if (!StringUtils.hasText(product.getStripePriceId())) {
            throw new PaymentProcessingException("This product is not configured for Stripe Checkout");
        }

        boolean subscription = "subscription".equalsIgnoreCase(product.getType());
        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(subscription ? SessionCreateParams.Mode.SUBSCRIPTION : SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/payment/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/payment/cancelled")
                .setClientReferenceId(userId)
                .putMetadata("userId", userId)
                .putMetadata("productId", product.getId())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPrice(product.getStripePriceId())
                        .setQuantity(1L)
                        .build());

        if (subscription) {
            builder.setSubscriptionData(SessionCreateParams.SubscriptionData.builder()
                    .putMetadata("userId", userId)
                    .putMetadata("productId", product.getId())
                    .build());
        } else {
            builder.setPaymentIntentData(SessionCreateParams.PaymentIntentData.builder()
                    .putMetadata("userId", userId)
                    .putMetadata("productId", product.getId())
                    .build());
        }

        try {
            Session session = Session.create(builder.build());
            if (!StringUtils.hasText(session.getUrl())) {
                throw new PaymentProcessingException("Stripe did not return a Checkout URL");
            }
            return session.getUrl();
        } catch (StripeException ex) {
            throw new PaymentProcessingException("Unable to create Stripe Checkout session", ex);
        }
    }

    private String authenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() == null) {
            throw new AccessDeniedException("Authentication required");
        }
        return authentication.getPrincipal().toString();
    }
}
