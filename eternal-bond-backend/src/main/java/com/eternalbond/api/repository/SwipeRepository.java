package com.eternalbond.api.repository;

import com.eternalbond.api.model.Swipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SwipeRepository extends JpaRepository<Swipe, String> {

    boolean existsBySwiperIdAndSwipedIdAndAction(String swiperId, String swipedId, Swipe.SwipeAction action);

    Optional<Swipe> findBySwiperIdAndSwipedId(String swiperId, String swipedId);

    @org.springframework.data.jpa.repository.Query("SELECT s.swiper FROM Swipe s WHERE s.swiped.id = :userId AND s.action = com.eternalbond.api.model.Swipe.SwipeAction.like")
    java.util.List<com.eternalbond.api.model.Profile> findProfilesWhoLikedUser(@org.springframework.data.repository.query.Param("userId") String userId);
}
