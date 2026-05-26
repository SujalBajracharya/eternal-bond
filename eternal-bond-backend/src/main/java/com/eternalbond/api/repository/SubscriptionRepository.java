package com.eternalbond.api.repository;

import com.eternalbond.api.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, String> {

    List<Subscription> findAllByUserId(String userId);

    Optional<Subscription> findFirstByUserIdAndStatusOrderByExpiresAtDesc(String userId, String status);
}
