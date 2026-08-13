package com.eternalbond.api.service;

import com.eternalbond.api.model.Payment;
import com.eternalbond.api.repository.PaymentRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class TransactionService {

    private final PaymentRepository paymentRepository;

    public TransactionService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Payment getTransaction(String transactionId, String userId) {
        Payment payment = paymentRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!payment.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to access this transaction");
        }
        return payment;
    }

    public byte[] generateReceiptPdf(Payment payment) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, baos);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
            Font headerFont = new Font(Font.HELVETICA, 12, Font.BOLD);
            Font normalFont = new Font(Font.HELVETICA, 12, Font.NORMAL);

            Paragraph title = new Paragraph("ETERNALBOND\n----------------------------\nTransaction Receipt", titleFont);
            title.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("\n"));

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            document.add(new Paragraph("Transaction ID: " + payment.getId(), normalFont));
            document.add(new Paragraph("Date: " + (payment.getCreatedAt() != null ? payment.getCreatedAt().format(dtf) : "N/A"), normalFont));
            document.add(new Paragraph("\n"));

            document.add(new Paragraph("Customer:", headerFont));
            document.add(new Paragraph("User ID: " + (payment.getUserId() != null ? payment.getUserId() : "N/A"), normalFont));
            document.add(new Paragraph("\n"));

            document.add(new Paragraph("Purchase:", headerFont));
            document.add(new Paragraph("Product: " + (payment.getProductId() != null ? payment.getProductId() : "N/A"), normalFont));
            document.add(new Paragraph("Description: " + (payment.getDescription() != null ? payment.getDescription() : "N/A"), normalFont));
            document.add(new Paragraph("\n"));

            document.add(new Paragraph("Amount:", headerFont));
            double amount = payment.getAmount() != null ? payment.getAmount() / 100.0 : 0.0;
            document.add(new Paragraph(String.format("Total: NPR %.2f", amount), normalFont));
            document.add(new Paragraph("\n"));

            document.add(new Paragraph("Payment:", headerFont));
            document.add(new Paragraph("Payment Status: " + (payment.getStatus() != null ? payment.getStatus().name() : "N/A"), normalFont));
            document.add(new Paragraph("Payment Reference: " + (payment.getStripePaymentIntentId() != null ? payment.getStripePaymentIntentId() : "N/A"), normalFont));
            document.add(new Paragraph("\n----------------------------\nThank you for using EternalBond.", normalFont));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }
}
