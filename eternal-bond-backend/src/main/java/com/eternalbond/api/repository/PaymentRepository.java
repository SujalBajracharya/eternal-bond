package com.eternalbond.api.repository;

import com.eternalbond.api.model.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);

    Page<Payment> findAllByUserId(String userId, Pageable pageable);

    Optional<Payment> findByIdAndUserId(String id, String userId);
}
