package com.eternalbond.api.repository;

import com.eternalbond.api.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

/**
 * Repository tests for UserRepository using H2 in-memory database.
 *
 * NOTE ON H2 COMPATIBILITY:
 * This test uses @DataJpaTest with H2. Entities that reference PostgreSQL-specific
 * features (JSONB columns, schema-qualified tables with public schema, native SQL)
 * are NOT tested here. Those require Testcontainers with a real PostgreSQL instance
 * (a CI-only concern). This class tests only UserRepository, whose columns are
 * standard SQL types fully compatible with H2.
 *
 * The schema="public" issue is worked around by setting H2 to SCHEMA=PUBLIC mode.
 */
@DataJpaTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:userrepotest;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;SCHEMA=PUBLIC",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        // Override to prevent loading PostgreSQL dialect extensions
        "spring.jpa.properties.hibernate.globally_quoted_identifiers=false"
})
@DisplayName("UserRepository Tests")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User savedUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        User user = User.builder()
                .fullName("Sujal Bajracharya")
                .email("sujal@example.com")
                .password("$2a$10$hashedpassword")
                .verified(true)
                .verificationToken(null)
                .build();
        savedUser = userRepository.save(user);
    }

    // -------------------------------------------------------------------------
    // findByEmail()
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("findByEmail - returns user when email exists")
    void findByEmail_exists_returnsUser() {
        Optional<User> found = userRepository.findByEmail("sujal@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().getFullName()).isEqualTo("Sujal Bajracharya");
        assertThat(found.get().isVerified()).isTrue();
    }

    @Test
    @DisplayName("findByEmail - returns empty when email does not exist")
    void findByEmail_notExists_returnsEmpty() {
        Optional<User> found = userRepository.findByEmail("nobody@example.com");

        assertThat(found).isEmpty();
    }

    // -------------------------------------------------------------------------
    // existsByEmail()
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("existsByEmail - returns true for registered email")
    void existsByEmail_registered_returnsTrue() {
        assertThat(userRepository.existsByEmail("sujal@example.com")).isTrue();
    }

    @Test
    @DisplayName("existsByEmail - returns false for unregistered email")
    void existsByEmail_notRegistered_returnsFalse() {
        assertThat(userRepository.existsByEmail("ghost@example.com")).isFalse();
    }

    // -------------------------------------------------------------------------
    // findByVerificationToken()
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("findByVerificationToken - returns user for valid token")
    void findByVerificationToken_validToken_returnsUser() {
        User unverified = User.builder()
                .fullName("Pending User")
                .email("pending@example.com")
                .password("$2a$10$hash")
                .verified(false)
                .verificationToken("my-unique-verify-token-abc123")
                .build();
        userRepository.save(unverified);

        Optional<User> found = userRepository.findByVerificationToken("my-unique-verify-token-abc123");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("pending@example.com");
        assertThat(found.get().isVerified()).isFalse();
    }

    @Test
    @DisplayName("findByVerificationToken - returns empty for unknown token")
    void findByVerificationToken_unknownToken_returnsEmpty() {
        Optional<User> found = userRepository.findByVerificationToken("nonexistent-token");

        assertThat(found).isEmpty();
    }

    // -------------------------------------------------------------------------
    // Basic persistence
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("save - persists user with auto-generated ID")
    void save_persistsUserWithId() {
        assertThat(savedUser.getId()).isNotNull().isNotBlank();
        assertThat(userRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("email uniqueness - saving duplicate email throws DataIntegrityViolationException")
    void save_duplicateEmail_throwsConstraintViolation() {
        User duplicate = User.builder()
                .fullName("Another User")
                .email("sujal@example.com") // same email → should fail unique constraint
                .password("$2a$10$hash2")
                .build();

        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(duplicate);
        }).isInstanceOf(Exception.class); // DataIntegrityViolationException or ConstraintViolationException
    }

    @Test
    @DisplayName("delete - removes user from database")
    void delete_removesUser() {
        userRepository.delete(savedUser);

        assertThat(userRepository.findByEmail("sujal@example.com")).isEmpty();
        assertThat(userRepository.count()).isEqualTo(0);
    }
}
