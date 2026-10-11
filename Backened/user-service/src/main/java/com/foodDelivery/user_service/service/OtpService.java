package com.foodDelivery.user_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;

    private static final String OTP_PREFIX = "otp:";
    private static final long OTP_EXPIRY_MINUTES = 5;

    public void generateAndSendOtp(String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Store in Redis with 5 min expiry
        redisTemplate.opsForValue().set(
                OTP_PREFIX + email, otp, OTP_EXPIRY_MINUTES, TimeUnit.MINUTES
        );

        // Always log OTP to console (for development/testing)
        log.info("======================================");
        log.info("  OTP for {} : {}", email, otp);
        log.info("======================================");

        // Try to send email, but don't crash if it fails
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Food Delivery - Verify Your Email");
            message.setText("Your OTP is: " + otp + "\nValid for 5 minutes.");
            mailSender.send(message);
            log.info("OTP email sent successfully to {}", email);
        } catch (Exception e) {
            log.warn("Email sending failed ({}). Use OTP from console log above.", e.getMessage());
        }
    }

    public boolean verifyOtp(String email, String otp) {
        String storedOtp = redisTemplate.opsForValue().get(OTP_PREFIX + email);
        if (storedOtp != null && storedOtp.equals(otp)) {
            redisTemplate.delete(OTP_PREFIX + email);  // One-time use
            return true;
        }
        return false;
    }
}