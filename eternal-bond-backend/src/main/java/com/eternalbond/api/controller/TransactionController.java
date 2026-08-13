package com.eternalbond.api.controller;

import com.eternalbond.api.model.Payment;
import com.eternalbond.api.service.TransactionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService service;

    public TransactionController(TransactionService service) {
        this.service = service;
    }

    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new RuntimeException("Unauthorized");
        }
        return auth.getPrincipal().toString();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getTransaction(@PathVariable String id) {
        String userId = getAuthenticatedUserId();
        return ResponseEntity.ok(service.getTransaction(id, userId));
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> getReceipt(@PathVariable String id) {
        String userId = getAuthenticatedUserId();
        Payment payment = service.getTransaction(id, userId);
        byte[] pdf = service.generateReceiptPdf(payment);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"receipt_" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
