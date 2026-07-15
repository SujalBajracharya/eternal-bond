package com.eternalbond.api.dto;

import com.eternalbond.api.model.Payment;
import com.eternalbond.api.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class PaymentDetailsDto {

    private String id;
    private Long amount;
    private String currency;
    private PaymentStatus status;
    private String description;
    private String stripePaymentIntentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PaymentDetailsDto fromEntity(Payment payment) {
        return PaymentDetailsDto.builder()
                .id(payment.getId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .description(payment.getDescription())
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
