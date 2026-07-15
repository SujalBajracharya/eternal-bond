package com.eternalbond.api.dto;

import com.eternalbond.api.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundResponse {

    private String paymentId;
    private String refundId;
    private Long amount;
    private PaymentStatus status;
    private String message;
}
