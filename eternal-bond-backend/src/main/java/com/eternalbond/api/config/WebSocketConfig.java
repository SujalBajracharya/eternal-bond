package com.eternalbond.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Outbound channels: clients will subscribe to /topic or /queue
        registry.enableSimpleBroker("/queue", "/topic");
        // Inbound prefix: clients send messages prefixing with /app
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Registers /ws endpoint for connections
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Configure origin patterns in production
                .withSockJS(); // Fallback for browsers that do not support raw web sockets
    }
}
