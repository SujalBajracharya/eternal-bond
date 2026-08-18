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
     * Returns profile IDs recommended to the user within the rolling recency window
     * ({@code cutoff} ≤ matchDate < {@code today}).
     *
     * <p>Only dates strictly before {@code today} are included so that the current
     * day being generated is never self-excluded.  Only dates on or after {@code cutoff}
     * are included so that profiles recommended more than {@code RECOMMENDATION_WINDOW_DAYS}
     * days ago are no longer considered "recently seen" and become eligible for recycling.
     *
     * @param userId  the user whose history is queried
     * @param today   the current calendar date (exclusive upper bound)
     * @param cutoff  the oldest date still considered "recent" (inclusive lower bound)
     */
    @Query("SELECT dm.recommendedProfileId FROM DailyMatch dm " +
           "WHERE dm.userId = :userId AND dm.matchDate < :today AND dm.matchDate >= :cutoff")
    List<String> findRecentlyRecommendedProfileIds(
            @Param("userId") String userId,
            @Param("today") LocalDate today,
            @Param("cutoff") LocalDate cutoff
    );

    /**
     * Returns all profile IDs recommended to the user historically (any time before today).
     */
    @Query("SELECT dm.recommendedProfileId FROM DailyMatch dm " +
           "WHERE dm.userId = :userId AND dm.matchDate < :today")
    List<String> findAlreadyRecommendedProfileIds(
            @Param("userId") String userId,
            @Param("today") LocalDate today
    );
}
