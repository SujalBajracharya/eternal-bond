package com.eternalbond.api.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
public class RefundRequest {

    @Positive(message = "Refund amount must be greater than zero")
    private Long amount;

    @Size(max = 200, message = "Refund reason must be at most 200 characters")
    private String reason;
}
