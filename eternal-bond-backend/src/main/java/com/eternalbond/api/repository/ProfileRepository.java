package com.eternalbond.api.repository;

import com.eternalbond.api.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, String> {

    Optional<Profile> findByEmail(String email);

    // Queries profiles to match the user's preferences, excluding already swiped profiles
    @Query("SELECT p FROM Profile p WHERE p.id != :userId " +
           "AND p.profileCompleted = true " +
           "AND (:lookingFor IS NULL OR p.gender = :lookingFor) " +
           "AND p.id NOT IN (SELECT s.swiped.id FROM Swipe s WHERE s.swiper.id = :userId)")
    List<Profile> findDailyMatchesForUser(
            @Param("userId") String userId,
            @Param("lookingFor") Profile.GenderType lookingFor
    );
}
