package com.eternalbond.api.service;

import com.eternalbond.api.dto.PaymentDetailsDto;
import com.eternalbond.api.dto.PaymentRequest;
import com.eternalbond.api.dto.PaymentResponse;
import com.eternalbond.api.dto.PaymentSummaryDto;
import com.eternalbond.api.dto.RefundRequest;
import com.eternalbond.api.dto.RefundResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StripeService {

    PaymentResponse createPaymentIntent(PaymentRequest request);

    String handleWebhook(String payload, String signatureHeader);

    Page<PaymentSummaryDto> getPayments(Pageable pageable);

    PaymentDetailsDto getPaymentById(String paymentId);

    RefundResponse refundPayment(String paymentId, RefundRequest request);
}
