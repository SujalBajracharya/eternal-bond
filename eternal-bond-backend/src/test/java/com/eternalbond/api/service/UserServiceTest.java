package com.eternalbond.api.service;

import com.eternalbond.api.dto.AuthResponse;
import com.eternalbond.api.dto.LoginRequest;
import com.eternalbond.api.dto.SignupRequest;
import com.eternalbond.api.dto.SignupResponse;
import com.eternalbond.api.dto.UserDto;
import com.eternalbond.api.exception.EmailNotVerifiedException;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.model.User;
import com.eternalbond.api.repository.ProfileRepository;
import com.eternalbond.api.repository.UserRepository;
import com.eternalbond.api.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ProfileRepository profileRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private EmailService emailService;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user-uuid-001")
                .fullName("Sujal Bajracharya")
                .email("sujal@example.com")
                .password("$2a$10$hashedpassword")
                .verified(true)
                .verificationToken(null)
                .build();
    }

    // -------------------------------------------------------------------------
    // signup()
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("signup - creates user, profile and sends verification email")
    void signup_success() {
        SignupRequest request = new SignupRequest("Sujal Bajracharya", "sujal@example.com", "Password123!");

        when(userRepository.existsByEmail("sujal@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("$2a$10$hashed");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        doNothing().when(emailService).sendVerificationEmail(any(), any());

        SignupResponse response = userService.signup(request);

        assertThat(response.getMessage()).contains("Verification email sent");
        verify(userRepository).save(any(User.class));
        verify(profileRepository).save(any(Profile.class));
        verify(emailService).sendVerificationEmail(eq("sujal@example.com"), any());
    }

    @Test
    @DisplayName("signup - throws when email already registered")
    void signup_emailAlreadyExists_throwsIllegalArgument() {
        SignupRequest request = new SignupRequest("Sujal", "sujal@example.com", "Password123!");
        when(userRepository.existsByEmail("sujal@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.signup(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already registered");

        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendVerificationEmail(any(), any());
    }

    @Test
    @DisplayName("signup - saves a user with encoded password, not plain text")
    void signup_passwordIsEncoded() {
        SignupRequest request = new SignupRequest("Sujal", "sujal@example.com", "PlainPass!");
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode("PlainPass!")).thenReturn("$2a$10$encoded");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        userService.signup(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("$2a$10$encoded");
        assertThat(captor.getValue().getPassword()).doesNotContain("PlainPass!");
    }

    // -------------------------------------------------------------------------
    // login()
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("login - returns JWT for valid, verified user")
    void login_success() {
        LoginRequest request = new LoginRequest("sujal@example.com", "Password123!");
        when(userRepository.findByEmail("sujal@example.com")).thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(jwtService.generateToken("user-uuid-001", "sujal@example.com")).thenReturn("jwt.token.here");

        AuthResponse response = userService.login(request);

        assertThat(response.getToken()).isEqualTo("jwt.token.here");
        assertThat(response.getUser().getEmail()).isEqualTo("sujal@example.com");
    }

    @Test
    @DisplayName("login - throws UsernameNotFoundException when user not found")
    void login_userNotFound_throws() {
        LoginRequest request = new LoginRequest("notfound@example.com", "pass");
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    @DisplayName("login - throws BadCredentialsException for wrong password")
    void login_wrongPassword_throws() {
        LoginRequest request = new LoginRequest("sujal@example.com", "WrongPass");
        when(userRepository.findByEmail("sujal@example.com")).thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("login - throws EmailNotVerifiedException when user is not verified")
    void login_emailNotVerified_throws() {
        User unverified = User.builder()
                .id("u2")
                .email("sujal@example.com")
                .password("$2a$10$hashed")
                .verified(false)
                .build();
        LoginRequest request = new LoginRequest("sujal@example.com", "Password123!");
        when(userRepository.findByEmail("sujal@example.com")).thenReturn(Optional.of(unverified));
        when(authenticationManager.authenticate(any())).thenReturn(null);

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(EmailNotVerifiedException.class)
                .hasMessageContaining("verify your email");
    }

    // -------------------------------------------------------------------------
    // verifyEmail()
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("verifyEmail - marks user as verified and clears token")
    void verifyEmail_success() {
        User unverified = User.builder()
                .id("u3")
                .email("test@example.com")
                .verified(false)
                .verificationToken("valid-token-abc")
                .build();
        when(userRepository.findByVerificationToken("valid-token-abc")).thenReturn(Optional.of(unverified));

        userService.verifyEmail("valid-token-abc");

        assertThat(unverified.isVerified()).isTrue();
        assertThat(unverified.getVerificationToken()).isNull();
        verify(userRepository).save(unverified);
    }

    @Test
    @DisplayName("verifyEmail - throws for invalid token")
    void verifyEmail_invalidToken_throws() {
        when(userRepository.findByVerificationToken("bad-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.verifyEmail("bad-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired");
    }

    @Test
    @DisplayName("verifyEmail - throws for null token")
    void verifyEmail_nullToken_throws() {
        assertThatThrownBy(() -> userService.verifyEmail(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or missing");
    }

    @Test
    @DisplayName("verifyEmail - throws for blank token")
    void verifyEmail_blankToken_throws() {
        assertThatThrownBy(() -> userService.verifyEmail("   "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or missing");
    }

    // -------------------------------------------------------------------------
    // getUserById()
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("getUserById - returns UserDto for valid ID")
    void getUserById_success() {
        when(userRepository.findById("user-uuid-001")).thenReturn(Optional.of(testUser));

        UserDto dto = userService.getUserById("user-uuid-001");

        assertThat(dto.getId()).isEqualTo("user-uuid-001");
        assertThat(dto.getEmail()).isEqualTo("sujal@example.com");
        assertThat(dto.getFullName()).isEqualTo("Sujal Bajracharya");
    }

    @Test
    @DisplayName("getUserById - throws for unknown ID")
    void getUserById_notFound_throws() {
        when(userRepository.findById("unknown-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById("unknown-id"))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
