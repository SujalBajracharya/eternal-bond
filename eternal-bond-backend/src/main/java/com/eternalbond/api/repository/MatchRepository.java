package com.eternalbond.api.repository;

import com.eternalbond.api.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, String> {

    @Query("SELECT m FROM Match m WHERE m.userOne.id = :userId OR m.userTwo.id = :userId")
    List<Match> findAllByUserId(@Param("userId") String userId);

    @Query("SELECT m FROM Match m WHERE " +
           "(m.userOne.id = :u1 AND m.userTwo.id = :u2) OR " +
           "(m.userOne.id = :u2 AND m.userTwo.id = :u1)")
    Optional<Match> findMutualMatch(@Param("u1") String userOneId, @Param("u2") String userTwoId);
}
