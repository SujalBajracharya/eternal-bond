package com.eternalbond.api.config;

import com.eternalbond.api.filter.JwtAuthFilter;
import com.eternalbond.api.security.OAuth2SuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtFilter;
    private final UserDetailsService userDetailsService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final PasswordEncoder passwordEncoder;

    public SecurityConfig(
            JwtAuthFilter jwtFilter,
            UserDetailsService userDetailsService,
            OAuth2SuccessHandler oAuth2SuccessHandler,
            PasswordEncoder passwordEncoder) {

        this.jwtFilter = jwtFilter;
        this.userDetailsService = userDetailsService;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // Disable CSRF for stateless REST endpoints using Authorization: Bearer header
                .csrf(csrf -> csrf.disable())
                // Apply strict CORS policy
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Ephemeral session policy for OAuth2 state preservation
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .sessionFixation(sessionFixation -> sessionFixation.migrateSession())
                        .maximumSessions(1)
                        .maxSessionsPreventsLogin(false)
                )
                // Modern HTTP Security Headers
                .headers(headers -> headers
                        // Content Security Policy (CSP)
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-ancestors 'none'; object-src 'none'; base-uri 'self';")
                        )
                        // Anti-Clickjacking
                        .frameOptions(frame -> frame.deny())
                        // Prevent MIME-type sniffing
                        .contentTypeOptions(ct -> {})
                        // Referrer Policy
                        .referrerPolicy(referrer -> referrer
                                .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                        )
                        // Permissions Policy (Feature Policy)
                        .permissionsPolicy(permissions -> permissions
                                .policy("camera=(), microphone=(), geolocation=(), payment=()")
                        )
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/auth/**",
                                "/oauth2/**",
                                "/login/**",
                                "/api/payments/webhook",
                                "/api/monetize/webhook",
                                "/actuator/health",
                                "/actuator/info"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .successHandler(oAuth2SuccessHandler)
                )
                .logout(logout -> logout
                        .logoutUrl("/auth/logout")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"message\":\"Logged out successfully\"}");
                        })
                )
                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager() {

        DaoAuthenticationProvider authProvider =
                new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);

        return new ProviderManager(authProvider);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        // Explicit allowed origin patterns for local development and SPA frontend
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:8080",
                "http://localhost:3000"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));
        config.setExposedHeaders(List.of(
                "Authorization",
                "Link",
                "X-Total-Count",
                "Content-Disposition"
        ));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // Preflight cache 1 hour

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}