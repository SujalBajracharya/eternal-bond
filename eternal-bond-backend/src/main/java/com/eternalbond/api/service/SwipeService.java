package com.eternalbond.api.service;

import com.eternalbond.api.dto.ProfileDto;
import com.eternalbond.api.dto.SwipeRequest;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.Match;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.model.Swipe;
import com.eternalbond.api.repository.MatchRepository;
import com.eternalbond.api.repository.ProfileRepository;
import com.eternalbond.api.repository.SwipeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class SwipeService {

    private final SwipeRepository swipeRepository;
    private final MatchRepository matchRepository;
    private final ProfileRepository profileRepository;
    private final EntitlementService entitlementService;

    public SwipeService(
            SwipeRepository swipeRepository,
            MatchRepository matchRepository,
            ProfileRepository profileRepository,
            EntitlementService entitlementService) {
        this.swipeRepository = swipeRepository;
        this.matchRepository = matchRepository;
        this.profileRepository = profileRepository;
        this.entitlementService = entitlementService;
    }

    @Transactional
    public boolean registerSwipe(String swiperId, SwipeRequest request) {
        String swipedId = request.getProfileId();
        Swipe.SwipeAction action = Swipe.SwipeAction.valueOf(request.getAction().toLowerCase());

        Profile swiper = profileRepository.findById(swiperId)
                .orElseThrow(() -> new ResourceNotFoundException("Swiper profile not found"));
        Profile swiped = profileRepository.findById(swipedId)
                .orElseThrow(() -> new ResourceNotFoundException("Swiped target profile not found"));

        // Retrieve existing swipe decision to prevent duplicate database writes
        java.util.Optional<Swipe> existingSwipeOpt = swipeRepository.findBySwiperIdAndSwipedId(swiperId, swipedId);
        if (existingSwipeOpt.isPresent()) {
            throw new IllegalArgumentException("You have already made a decision on this profile.");
        }

        // Check if there is a mutual "like" to declare a match
        if (action == Swipe.SwipeAction.like) {
            // ── Validate entitlement BEFORE writing anything to the DB ──
            // This ensures no dirty write occurs if the limit is exceeded.
            if (!entitlementService.canLike(swiperId)) {
                throw new com.eternalbond.api.exception.LimitExceededException(
                        "Daily like limit reached. Upgrade to Premium or buy an extra like.");
            }
        }

        Swipe swipe = Swipe.builder().swiper(swiper).swiped(swiped).build();
        swipe.setAction(action);
        swipe.setCreatedAt(LocalDateTime.now());
        
        try {
            swipeRepository.saveAndFlush(swipe);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new IllegalArgumentException("You have already made a decision on this profile.");
        }

        if (action == Swipe.SwipeAction.like) {
            // Record the like usage (we already verified canLike above)
            entitlementService.consumeLike(swiperId);

            boolean reciprocalLike = swipeRepository.existsBySwiperIdAndSwipedIdAndAction(
                    swipedId, swiperId, Swipe.SwipeAction.like);

            if (reciprocalLike) {
                // Keep ID order consistent: userOneId < userTwoId
                Profile userOne = swiperId.compareTo(swipedId) < 0 ? swiper : swiped;
                Profile userTwo = swiperId.compareTo(swipedId) < 0 ? swiped : swiper;

                // Check if match already logged
                if (matchRepository.findMutualMatch(userOne.getId(), userTwo.getId()).isEmpty()) {
                    // Set 48-hour expiration unless at least one user is premium
                    LocalDateTime expiresAt = null;
                    boolean eitherPremium = entitlementService.hasActivePremium(swiperId)
                            || entitlementService.hasActivePremium(swipedId);
                    if (!eitherPremium) {
                        expiresAt = LocalDateTime.now().plusHours(48);
                    }

                    Match match = Match.builder()
                            .userOne(userOne)
                            .userTwo(userTwo)
                            .createdAt(LocalDateTime.now())
                            .expiresAt(expiresAt)
                            .status("active")
                            .build();
                    matchRepository.save(match);
                    return true; // Match celebrated!
                }
            }
        }
        return false; // Swipe recorded but no mutual match
    }

    @Transactional(readOnly = true)
    public java.util.List<com.eternalbond.api.dto.ProfileDto> getAdmirers(String userId) {
        return swipeRepository.findProfilesWhoLikedUser(userId)
                .stream()
                .map(p -> ProfileDto.builder()
                        .id(p.getId())
                        .fullName(p.getFullName())
                        .gender(p.getGender())
                        .dateOfBirth(p.getDateOfBirth())
                        .location(p.getLocation())
                        .bio(p.getBio())
                        .profession(p.getProfession())
                        .avatarUrl(p.getAvatarUrl())
                        .photos(p.getPhotos())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void deleteSwipe(String swiperId, String swipedId) {
        Swipe swipe = swipeRepository.findBySwiperIdAndSwipedId(swiperId, swipedId)
                .orElseThrow(() -> new ResourceNotFoundException("Swipe not found"));
        swipeRepository.delete(swipe);
    }
}
