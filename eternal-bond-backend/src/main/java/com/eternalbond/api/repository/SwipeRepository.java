package com.eternalbond.api.repository;

import com.eternalbond.api.model.Swipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SwipeRepository extends JpaRepository<Swipe, String> {

    boolean existsBySwiperIdAndSwipedIdAndAction(String swiperId, String swipedId, Swipe.SwipeAction action);

    Optional<Swipe> findBySwiperIdAndSwipedId(String swiperId, String swipedId);
}
