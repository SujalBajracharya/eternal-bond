package com.eternalbond.api.service;

import com.eternalbond.api.dto.ProfileDto;
import com.eternalbond.api.dto.SwipeRequest;
import com.eternalbond.api.exception.LimitExceededException;
import com.eternalbond.api.exception.ResourceNotFoundException;
import com.eternalbond.api.model.Match;
import com.eternalbond.api.model.Profile;
import com.eternalbond.api.model.Swipe;
import com.eternalbond.api.repository.MatchRepository;
import com.eternalbond.api.repository.ProfileRepository;
import com.eternalbond.api.repository.SwipeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SwipeService Unit Tests")
class SwipeServiceTest {

    @Mock private SwipeRepository swipeRepository;
    @Mock private MatchRepository matchRepository;
    @Mock private ProfileRepository profileRepository;
    @Mock private EntitlementService entitlementService;

    @InjectMocks
    private SwipeService swipeService;

    private Profile swiper;
    private Profile swiped;

    @BeforeEach
    void setUp() {
        swiper = Profile.builder().id("user-a").fullName("Alice").build();
        swiped = Profile.builder().id("user-b").fullName("Bob").build();
    }

    // -------------------------------------------------------------------------
    // registerSwipe() - dislike
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("registerSwipe - dislike: records swipe, returns false (no match)")
    void registerSwipe_dislike_returnsFalse() {
        SwipeRequest request = new SwipeRequest("user-b", "dislike");
        when(profileRepository.findById("user-a")).thenReturn(Optional.of(swiper));
        when(profileRepository.findById("user-b")).thenReturn(Optional.of(swiped));
        when(swipeRepository.findBySwiperIdAndSwipedId("user-a", "user-b")).thenReturn(Optional.empty());

        boolean matched = swipeService.registerSwipe("user-a", request);

        assertThat(matched).isFalse();
        verify(swipeRepository).saveAndFlush(any(Swipe.class));
        verifyNoInteractions(matchRepository);
        verifyNoInteractions(entitlementService);
    }

    // -------------------------------------------------------------------------
    // registerSwipe() - like without reciprocal
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("registerSwipe - like without reciprocal: records swipe, returns false")
    void registerSwipe_likeNoReciprocal_returnsFalse() {
        SwipeRequest request = new SwipeRequest("user-b", "like");
        when(profileRepository.findById("user-a")).thenReturn(Optional.of(swiper));
        when(profileRepository.findById("user-b")).thenReturn(Optional.of(swiped));
        when(swipeRepository.findBySwiperIdAndSwipedId("user-a", "user-b")).thenReturn(Optional.empty());
        when(entitlementService.canLike("user-a")).thenReturn(true);
        when(swipeRepository.existsBySwiperIdAndSwipedIdAndAction("user-b", "user-a", Swipe.SwipeAction.like)).thenReturn(false);

        boolean matched = swipeService.registerSwipe("user-a", request);

        assertThat(matched).isFalse();
        verify(entitlementService).consumeLike("user-a");
        verifyNoInteractions(matchRepository);
    }

    // -------------------------------------------------------------------------
    // registerSwipe() - mutual like creates match
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("registerSwipe - mutual like: creates match, returns true")
    void registerSwipe_mutualLike_createsMatchAndReturnsTrue() {
        SwipeRequest request = new SwipeRequest("user-b", "like");
        when(profileRepository.findById("user-a")).thenReturn(Optional.of(swiper));
        when(profileRepository.findById("user-b")).thenReturn(Optional.of(swiped));
        when(swipeRepository.findBySwiperIdAndSwipedId("user-a", "user-b")).thenReturn(Optional.empty());
        when(entitlementService.canLike("user-a")).thenReturn(true);
        when(swipeRepository.existsBySwiperIdAndSwipedIdAndAction("user-b", "user-a", Swipe.SwipeAction.like)).thenReturn(true);
        when(matchRepository.findMutualMatch(any(), any())).thenReturn(Optional.empty());
        when(entitlementService.hasActivePremium("user-a")).thenReturn(false);
        when(entitlementService.hasActivePremium("user-b")).thenReturn(false);

        boolean matched = swipeService.registerSwipe("user-a", request);

        assertThat(matched).isTrue();
        verify(matchRepository).save(any(Match.class));
    }

    // -------------------------------------------------------------------------
    // registerSwipe() - like limit exceeded
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("registerSwipe - like when limit exceeded: throws LimitExceededException")
    void registerSwipe_likeLimit_throwsLimitExceeded() {
        SwipeRequest request = new SwipeRequest("user-b", "like");
        when(profileRepository.findById("user-a")).thenReturn(Optional.of(swiper));
        when(profileRepository.findById("user-b")).thenReturn(Optional.of(swiped));
        when(swipeRepository.findBySwiperIdAndSwipedId("user-a", "user-b")).thenReturn(Optional.empty());
        when(entitlementService.canLike("user-a")).thenReturn(false);

        assertThatThrownBy(() -> swipeService.registerSwipe("user-a", request))
                .isInstanceOf(LimitExceededException.class)
                .hasMessageContaining("Daily like limit");
    }

    // -------------------------------------------------------------------------
    // registerSwipe() - profile not found
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("registerSwipe - swiper profile not found: throws ResourceNotFoundException")
    void registerSwipe_swiperNotFound_throws() {
        SwipeRequest request = new SwipeRequest("user-b", "like");
        when(profileRepository.findById("user-a")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> swipeService.registerSwipe("user-a", request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Swiper profile not found");
    }

    @Test
    @DisplayName("registerSwipe - swiped target profile not found: throws ResourceNotFoundException")
    void registerSwipe_swipedNotFound_throws() {
        SwipeRequest request = new SwipeRequest("user-b", "like");
        when(profileRepository.findById("user-a")).thenReturn(Optional.of(swiper));
        when(profileRepository.findById("user-b")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> swipeService.registerSwipe("user-a", request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Swiped target profile not found");
    }

    // -------------------------------------------------------------------------
    // registerSwipe() - mutual like: no duplicate match if match already exists
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("registerSwipe - match already exists: does not create duplicate match")
    void registerSwipe_mutualLike_noMatchIfAlreadyExists() {
        SwipeRequest request = new SwipeRequest("user-b", "like");
        when(profileRepository.findById("user-a")).thenReturn(Optional.of(swiper));
        when(profileRepository.findById("user-b")).thenReturn(Optional.of(swiped));
        when(swipeRepository.findBySwiperIdAndSwipedId("user-a", "user-b")).thenReturn(Optional.empty());
        when(entitlementService.canLike("user-a")).thenReturn(true);
        when(swipeRepository.existsBySwiperIdAndSwipedIdAndAction("user-b", "user-a", Swipe.SwipeAction.like)).thenReturn(true);
        when(matchRepository.findMutualMatch(any(), any())).thenReturn(Optional.of(Match.builder().build()));

        boolean matched = swipeService.registerSwipe("user-a", request);

        assertThat(matched).isFalse();
        verify(matchRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // registerSwipe() - premium match: no expiry set
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("registerSwipe - premium user match: expiresAt is null (no 48h limit)")
    void registerSwipe_premiumMatch_noExpiry() {
        SwipeRequest request = new SwipeRequest("user-b", "like");
        when(profileRepository.findById("user-a")).thenReturn(Optional.of(swiper));
        when(profileRepository.findById("user-b")).thenReturn(Optional.of(swiped));
        when(swipeRepository.findBySwiperIdAndSwipedId("user-a", "user-b")).thenReturn(Optional.empty());
        when(entitlementService.canLike("user-a")).thenReturn(true);
        when(swipeRepository.existsBySwiperIdAndSwipedIdAndAction("user-b", "user-a", Swipe.SwipeAction.like)).thenReturn(true);
        when(matchRepository.findMutualMatch(any(), any())).thenReturn(Optional.empty());
        when(entitlementService.hasActivePremium("user-a")).thenReturn(true);
        // NOTE: hasActivePremium("user-b") is NOT stubbed because Java short-circuits
        // the OR: once user-a is premium, eitherPremium = true immediately.

        swipeService.registerSwipe("user-a", request);

        ArgumentCaptor<Match> captor = ArgumentCaptor.forClass(Match.class);
        verify(matchRepository).save(captor.capture());
        assertThat(captor.getValue().getExpiresAt()).isNull();
    }

    // -------------------------------------------------------------------------
    // getAdmirers()
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("getAdmirers - returns mapped ProfileDtos of users who liked")
    void getAdmirers_returnsMappedProfiles() {
        when(swipeRepository.findProfilesWhoLikedUser("user-a")).thenReturn(List.of(swiped));

        List<ProfileDto> admirers = swipeService.getAdmirers("user-a");

        assertThat(admirers).hasSize(1);
        assertThat(admirers.get(0).getId()).isEqualTo("user-b");
        assertThat(admirers.get(0).getFullName()).isEqualTo("Bob");
    }
}
