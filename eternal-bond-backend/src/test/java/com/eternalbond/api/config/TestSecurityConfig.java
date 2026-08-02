package com.eternalbond.api.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Minimal security configuration for @WebMvcTest slice tests.
 *
 * The real SecurityConfig uses oauth2Login() which causes Spring Security to
 * redirect unauthenticated requests (302 to /oauth2/authorization/google) even
 * on permitAll() paths when CSRF tokens are not present.  This test config
 * disables all of that so controller tests can focus on business logic instead
 * of fighting the security layer.
 *
 * Usage: import this class in @WebMvcTest via @Import(TestSecurityConfig.class)
 */
@TestConfiguration
public class TestSecurityConfig {

    @Bean
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        return http.build();
    }
}
