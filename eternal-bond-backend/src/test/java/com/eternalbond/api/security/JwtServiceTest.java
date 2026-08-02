package com.eternalbond.api.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtService Unit Tests")
class JwtServiceTest {

    private JwtService jwtService;

    private static final String TEST_SECRET = "test-super-secret-jwt-key-at-least-32-chars";
    private static final String USER_ID = "user-uuid-001";
    private static final String EMAIL = "sujal@example.com";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", TEST_SECRET);
    }

    // -------------------------------------------------------------------------
    // generateToken / extractUsername
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("generateToken - returns non-null, non-blank JWT string")
    void generateToken_returnsJwt() {
        String token = jwtService.generateToken(USER_ID, EMAIL);

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3); // header.payload.signature
    }

    @Test
    @DisplayName("extractUsername - returns userId from valid token")
    void extractUsername_returnsUserId() {
        String token = jwtService.generateToken(USER_ID, EMAIL);

        String extracted = jwtService.extractUsername(token);

        assertThat(extracted).isEqualTo(USER_ID);
    }

    // -------------------------------------------------------------------------
    // isTokenValid
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("isTokenValid - returns true for a valid token matching the user")
    void isTokenValid_validToken_returnsTrue() {
        String token = jwtService.generateToken(USER_ID, EMAIL);

        assertThat(jwtService.isTokenValid(token, USER_ID)).isTrue();
    }

    @Test
    @DisplayName("isTokenValid - returns false for token belonging to different user")
    void isTokenValid_wrongUserId_returnsFalse() {
        String token = jwtService.generateToken(USER_ID, EMAIL);

        assertThat(jwtService.isTokenValid(token, "different-user-id")).isFalse();
    }

    // -------------------------------------------------------------------------
    // expired token
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("extractUsername - throws ExpiredJwtException for expired token")
    void extractUsername_expiredToken_throws() {
        Key key = buildKey(TEST_SECRET);
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", EMAIL);

        String expiredToken = Jwts.builder()
                .setClaims(claims)
                .setSubject(USER_ID)
                .setIssuedAt(new Date(System.currentTimeMillis() - 100_000))
                .setExpiration(new Date(System.currentTimeMillis() - 1_000)) // expired 1 sec ago
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        assertThatThrownBy(() -> jwtService.extractUsername(expiredToken))
                .isInstanceOf(ExpiredJwtException.class);
    }

    // -------------------------------------------------------------------------
    // tampered token
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("extractUsername - throws for tampered/invalid token")
    void extractUsername_tamperedToken_throws() {
        String token = jwtService.generateToken(USER_ID, EMAIL);
        // Corrupt the signature part
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "invalidsignature";

        assertThatThrownBy(() -> jwtService.extractUsername(tampered))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("extractUsername - throws for completely malformed token")
    void extractUsername_malformedToken_throws() {
        assertThatThrownBy(() -> jwtService.extractUsername("not.a.jwt"))
                .isInstanceOf(Exception.class);
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
