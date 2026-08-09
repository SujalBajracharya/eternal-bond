package com.eternalbond.api.repository;

import com.eternalbond.api.model.DailyMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyMatchRepository extends JpaRepository<DailyMatch, String> {

    /**
     * Returns today's batch for the user, in the order they were originally assigned.
     */
    List<DailyMatch> findByUserIdAndMatchDateOrderBySortOrderAsc(String userId, LocalDate matchDate);

    /**
     * Checks if a batch already exists for this user on the given date.
     * Used to implement the "same-day idempotency" gate without loading full records.
     */
    boolean existsByUserIdAndMatchDate(String userId, LocalDate matchDate);

    /**
     * Returns all profile IDs that have ever been recommended to the given user on any previous day.
     * Used to exclude already-seen profiles when building tomorrow's batch.
     * This query deliberately excludes {@code today} so that we only exclude past days,
     * not the current day being generated.
     */
    @Query("SELECT dm.recommendedProfileId FROM DailyMatch dm " +
           "WHERE dm.userId = :userId AND dm.matchDate < :today")
    List<String> findAlreadyRecommendedProfileIds(
            @Param("userId") String userId,
            @Param("today") LocalDate today
    );
}
