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
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public UserService(UserRepository userRepository,
            ProfileRepository profileRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    @Transactional
    public SignupResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("This email is already registered. Try signing in.");
        }

        // 1. Create and save new User (unverified with verification token)
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .verified(false)
                .verificationToken(UUID.randomUUID().toString())
                .build();
        User savedUser = userRepository.save(user);

        // 2. Automatically create associated Profile to preserve foreign key mappings
        // and allow onboarding
        Profile profile = Profile.builder()
                .id(savedUser.getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .profileCompleted(false)
                .kycStatus(Profile.KycStatus.unverified)
                .photoVisibility(Profile.PrivacyLevel.everyone)
                .profileVisibility(Profile.PrivacyLevel.everyone)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        profileRepository.save(profile);

        // 3. Send verification email (throws EmailSendingException on failure)
        emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getVerificationToken());

        return new SignupResponse("Account created. Verification email sent.");
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        System.out.println("DEBUG: Login attempt for email: " + request.getEmail());
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + request.getEmail()));
                
        System.out.println("DEBUG: Found user in DB. Hash: " + user.getPassword());
        System.out.println("DEBUG: Does password match manually? " + passwordEncoder.matches(request.getPassword(), user.getPassword()));

        // This will now invoke your explicit ProviderManager with BCrypt
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));


        if (!user.isVerified()) {
            throw new EmailNotVerifiedException("Please verify your email before signing in.");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(mapToDto(user))
                .build();
    }

    @Transactional
    public void verifyEmail(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid or missing verification token.");
        }
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification token."));

        user.setVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + id));
        return mapToDto(user);
    }

    public UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
