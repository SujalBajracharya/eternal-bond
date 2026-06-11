package com.eternalbond.api.security;

import com.eternalbond.api.model.Profile;
import com.eternalbond.api.model.User;
import com.eternalbond.api.repository.ProfileRepository;
import com.eternalbond.api.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.url:http://localhost:8080}")
    private String frontendUrl;

    public OAuth2SuccessHandler(UserRepository userRepository,
                                ProfileRepository profileRepository,
                                JwtService jwtService,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        if (name == null) {
            name = oAuth2User.getAttribute("given_name");
        }
        if (name == null) {
            name = "Google User";
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    .fullName(name)
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .verified(true)
                    .build();
            user = userRepository.save(user);

            Profile profile = Profile.builder()
                    .id(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .profileCompleted(false)
                    .kycStatus(Profile.KycStatus.unverified)
                    .photoVisibility(Profile.PrivacyLevel.everyone)
                    .profileVisibility(Profile.PrivacyLevel.everyone)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            profileRepository.save(profile);
        } else if (!user.isVerified()) {
            user.setVerified(true);
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/signin")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
