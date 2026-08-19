package com.eternalbond.api.repository;

import com.eternalbond.api.model.PriorityInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface PriorityInterestRepository extends JpaRepository<PriorityInterest, UUID> {

    boolean existsByEntitlementId(UUID entitlementId);

    boolean existsBySenderIdAndTargetId(String senderId, String targetId);

    long countBySenderIdAndExpiresAtAfter(String senderId, LocalDateTime now);

    @Query("""
        SELECT p.senderId FROM PriorityInterest p
        WHERE p.targetId = :targetId
          AND p.senderId IN :senderIds
          AND (p.expiresAt IS NULL OR p.expiresAt > :now)
        """)
    List<String> findActiveSenderIdsForTarget(
            @Param("targetId") String targetId,
            @Param("senderIds") Collection<String> senderIds,
            @Param("now") LocalDateTime now
    );
}
