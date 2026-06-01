package com.eternalbond.api.service;

import com.eternalbond.api.exception.EmailSendingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
}
