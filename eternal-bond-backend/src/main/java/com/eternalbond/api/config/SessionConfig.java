package com.eternalbond.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.session.HttpSessionEventPublisher;

/**
 * Session Configuration Bean.
 * Publishes HttpSession lifecycle events (sessionCreated, sessionDestroyed)
 * to the Spring ApplicationContext, enabling Spring Security concurrent session management
 * and accurate session tracking.
 */
@Configuration
public class SessionConfig {

    @Bean
    public HttpSessionEventPublisher httpSessionEventPublisher() {
        return new HttpSessionEventPublisher();
    }
}
