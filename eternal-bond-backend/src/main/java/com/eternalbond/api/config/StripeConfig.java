package com.eternalbond.api.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class StripeConfig {

    private final String secretKey;
    private final String publishableKey;

    public StripeConfig(
            @Value("${stripe.secret-key:}") String secretKey,
            @Value("${stripe.public-key:}") String publishableKey) {
        this.secretKey = secretKey;
        this.publishableKey = publishableKey;
    }

    @PostConstruct
    public void init() {
        if (StringUtils.hasText(secretKey)) {
            Stripe.apiKey = secretKey;
        }
    }
}
