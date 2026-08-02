package com.eternalbond.api.exception;

import com.eternalbond.api.config.TestSecurityConfig;
import com.eternalbond.api.filter.JwtAuthFilter;
import com.eternalbond.api.repository.UserRepository;
import com.eternalbond.api.security.JwtService;
import com.eternalbond.api.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.web.servlet.MockMvc;
import com.eternalbond.api.controller.AuthController;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests that GlobalExceptionHandler returns correctly shaped JSON error responses
 * without exposing internal implementation details (no stack traces, no username enumeration).
 */
@WebMvcTest(
        controllers = AuthController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthFilter.class
        )
)
@Import(TestSecurityConfig.class)
@DisplayName("GlobalExceptionHandler Tests")
class GlobalExceptionHandlerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean UserService userService;
    @MockBean JwtService jwtService;
    @MockBean UserRepository userRepository;

    // -------------------------------------------------------------------------
    // Validation errors → 400 with structured body
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("MethodArgumentNotValidException → 400 with field errors, no stack trace")
    void validationFailure_returns400WithFieldErrors() throws Exception {
        String body = """
                {
                    "fullName": "",
                    "email": "sujal@example.com",
                    "password": "Password123!"
                }
                """;

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.details.fullName").exists())
                // Critical: ensure NO stack trace leaks to client
                .andExpect(jsonPath("$.trace").doesNotExist())
                .andExpect(jsonPath("$.path").doesNotExist());
    }

    // -------------------------------------------------------------------------
    // Business logic errors → 409
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("IllegalArgumentException (duplicate email) → 409 with clean message")
    void illegalArgument_returns409WithCleanMessage() throws Exception {
        String body = """
                {
                    "fullName": "Sujal",
                    "email": "sujal@example.com",
                    "password": "Password123!"
                }
                """;
        when(userService.signup(any()))
                .thenThrow(new IllegalArgumentException("This email is already registered. Try signing in."));

        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("This email is already registered. Try signing in."))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    // -------------------------------------------------------------------------
    // Auth errors → 401
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("EmailNotVerifiedException → 401 with appropriate message")
    void emailNotVerified_returns401WithCleanMessage() throws Exception {
        String body = """
                {
                    "email": "sujal@example.com",
                    "password": "Password123!"
                }
                """;
        when(userService.login(any()))
                .thenThrow(new EmailNotVerifiedException("Please verify your email before signing in."));

        mockMvc.perform(post("/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Please verify your email before signing in."));
    }

    @Test
    @DisplayName("UsernameNotFoundException → 401 with generic message (no username enumeration)")
    void usernameNotFound_returns401WithGenericMessage() throws Exception {
        String body = """
                {
                    "email": "notexist@example.com",
                    "password": "Password123!"
                }
                """;
        when(userService.login(any()))
                .thenThrow(new UsernameNotFoundException("User not found: notexist@example.com"));

        mockMvc.perform(post("/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                // Safe generic message — must NOT reveal whether the email exists
                .andExpect(jsonPath("$.message").value("Invalid email or password"))
                .andExpect(result -> {
                    String responseBody = result.getResponse().getContentAsString();
                    assert !responseBody.contains("notexist@example.com")
                            : "Response body must not expose the queried email address";
                });
    }
}
