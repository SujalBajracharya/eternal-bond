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
public class PaymentSummaryDto {

    private String id;
    private Long amount;
    private String currency;
    private PaymentStatus status;
    private String description;
    private LocalDateTime createdAt;

    public static PaymentSummaryDto fromEntity(Payment payment) {
        return PaymentSummaryDto.builder()
                .id(payment.getId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .description(payment.getDescription())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
