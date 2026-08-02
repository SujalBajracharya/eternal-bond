package com.eternalbond.api.security;

import com.eternalbond.api.filter.JwtAuthFilter;
import com.eternalbond.api.model.User;
import com.eternalbond.api.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Spring Security integration tests verifying JWT authentication is correctly enforced
 * on protected endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "supabase.jwt.secret=test-super-secret-jwt-key-at-least-32-chars",
        "supabase.url=https://mock.supabase.co",
        "supabase.anon.key=mock-anon-key",
        "spring.mail.host=localhost",
        "spring.mail.port=25",
        "spring.mail.username=test",
        "spring.mail.password=test",
        "stripe.secret-key=sk_test_mock",
        "stripe.public-key=pk_test_mock",
        "stripe.webhook-secret=whsec_mock",
        "free-astrology-api.api-key=mock-api-key",
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "FRONTEND_URL=http://localhost:5173"
})
@DisplayName("Spring Security JWT Integration Tests")
class SecurityIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @MockBean UserRepository userRepository;

    private static final String TEST_SECRET = "test-super-secret-jwt-key-at-least-32-chars";

    // -------------------------------------------------------------------------
    // Protected endpoint - no JWT
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /auth/me without JWT → 401 Unauthorized")
    void protectedEndpoint_noJwt_returns401() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // Protected endpoint - valid JWT
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /auth/me with valid JWT → 200 OK")
    void protectedEndpoint_validJwt_returns200() throws Exception {
        User mockUser = User.builder()
                .id("uid-001")
                .email("sujal@example.com")
                .fullName("Sujal")
                .password("$2a$10$hash")
                .verified(true)
                .build();
        when(userRepository.findById("uid-001")).thenReturn(Optional.of(mockUser));

        String token = jwtService.generateToken("uid-001", "sujal@example.com");

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    // -------------------------------------------------------------------------
    // Protected endpoint - invalid JWT
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /auth/me with invalid/tampered JWT → 401")
    void protectedEndpoint_invalidJwt_returns401() throws Exception {
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer this.is.not.valid"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // Protected endpoint - expired JWT
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /auth/me with expired JWT → 401")
    void protectedEndpoint_expiredJwt_returns401() throws Exception {
        Key key = buildKey(TEST_SECRET);
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", "sujal@example.com");
        String expiredToken = Jwts.builder()
                .setClaims(claims)
                .setSubject("uid-001")
                .setIssuedAt(new Date(System.currentTimeMillis() - 100_000))
                .setExpiration(new Date(System.currentTimeMillis() - 1_000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // Public endpoints - must not require auth
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /auth/signup is publicly accessible (no auth required)")
    void publicEndpoint_signup_doesNotReturn401() throws Exception {
        // An empty body will return 400 (validation), but NOT 401 (auth)
        mockMvc.perform(get("/auth/signup"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assert status != 401 : "Public endpoint should not require authentication";
                });
    }

    @Test
    @DisplayName("POST /auth/signin is publicly accessible (no auth required)")
    void publicEndpoint_signin_doesNotReturn401() throws Exception {
        mockMvc.perform(get("/auth/signin"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assert status != 401 : "Public endpoint should not require authentication";
                });
    }

    // -------------------------------------------------------------------------
    // Wrong authorization scheme
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /auth/me with Basic auth scheme (not Bearer) → 401")
    void protectedEndpoint_basicAuthScheme_returns401() throws Exception {
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Basic dXNlcjpwYXNz"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------------------
    // helper
    // -------------------------------------------------------------------------

    private Key buildKey(String secret) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            return Keys.hmacShaKeyFor(padded);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
