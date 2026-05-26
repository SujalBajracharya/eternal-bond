package com.eternalbond.api.service;

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

    public SwipeService(SwipeRepository swipeRepository, MatchRepository matchRepository, ProfileRepository profileRepository) {
        this.swipeRepository = swipeRepository;
        this.matchRepository = matchRepository;
        this.profileRepository = profileRepository;
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
        Swipe swipe = swipeRepository.findBySwiperIdAndSwipedId(swiperId, swipedId)
                .orElseGet(() -> Swipe.builder().swiper(swiper).swiped(swiped).build());

        swipe.setAction(action);
        swipe.setCreatedAt(LocalDateTime.now());
        swipeRepository.save(swipe);

        // Check if there is a mutual "like" to declare a match
        if (action == Swipe.SwipeAction.like) {
            boolean reciprocalLike = swipeRepository.existsBySwiperIdAndSwipedIdAndAction(
                    swipedId, swiperId, Swipe.SwipeAction.like);

            if (reciprocalLike) {
                // Keep ID order consistent: userOneId < userTwoId
                Profile userOne = swiperId.compareTo(swipedId) < 0 ? swiper : swiped;
                Profile userTwo = swiperId.compareTo(swipedId) < 0 ? swiped : swiper;

                // Check if match already logged
                if (matchRepository.findMutualMatch(userOne.getId(), userTwo.getId()).isEmpty()) {
                    Match match = Match.builder()
                            .userOne(userOne)
                            .userTwo(userTwo)
                            .createdAt(LocalDateTime.now())
                            .build();
                    matchRepository.save(match);
                    return true; // Match celebrated!
                }
            }
        }
        return false; // Swipe recorded but no mutual match
    }
}
