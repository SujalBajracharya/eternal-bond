package com.eternalbond.api.service;

import com.eternalbond.api.exception.EmailSendingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendVerificationEmail(String toEmail, String token) {
        String verificationLink = "http://localhost:8081/auth/verify?token=" + token;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Please verify your email address");
            message.setText("Thank you for registering at EternalBond!\n\n" +
                    "Please click the link below to verify your email address and activate your account:\n" +
                    verificationLink + "\n\n" +
                    "If you did not create an account, please ignore this email.");
            message.setFrom(fromEmail);

            mailSender.send(message);
            logger.info("Verification email successfully sent to {}", toEmail);
        } catch (MailException ex) {
            logger.error("Failed to send verification email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new EmailSendingException("Failed to send verification email. Please verify your email address or try again.", ex);
        }
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Password Reset Request");
            message.setText("We received a request to reset your password for EternalBond.\n\n" +
                    "Please click the link below to set a new password:\n" +
                    resetLink + "\n\n" +
                    "If you did not request a password reset, please ignore this email.");
            message.setFrom(fromEmail);

            mailSender.send(message);
            logger.info("Password reset email successfully sent to {}", toEmail);
        } catch (MailException ex) {
            logger.error("Failed to send password reset email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new EmailSendingException("Failed to send password reset email.", ex);
        }
    }

    public void sendPurchaseConfirmationEmail(String toEmail, String userName, byte[] pdfAttachment) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(toEmail);
            helper.setSubject("Purchase Confirmation");
            helper.setText("Hello " + userName + ",\n\n" +
                    "Thank you for your purchase.\n\n" +
                    "Please find your purchase receipt/invoice attached to this email.\n\n" +
                    "Regards,\n" +
                    "EternalBond");
            helper.setFrom(fromEmail);
            helper.addAttachment("PurchaseReceipt.pdf", new ByteArrayResource(pdfAttachment));

            mailSender.send(message);
            logger.info("Purchase confirmation email successfully sent to {}", toEmail);
        } catch (Exception ex) {
            logger.error("Failed to send purchase confirmation email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new EmailSendingException("Failed to send purchase confirmation email.", ex);
        }
    }
}
