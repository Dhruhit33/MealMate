package com.foodDelivery.user_service.controller;

import com.foodDelivery.user_service.dto.AuthResponse;
import com.foodDelivery.user_service.dto.LoginRequest;
import com.foodDelivery.user_service.dto.RegisterRequest;
import com.foodDelivery.user_service.dto.VerifyOtpRequest;
import com.foodDelivery.user_service.service.AuthService;
import com.foodDelivery.user_service.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody RegisterRequest request){
        String otp = authService.initiateRegistration(request);
        Map<String, String> response = Map.of(
            "message", "Verification code generated! Your OTP is: " + otp,
            "otp", otp
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtpAndRegister(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, String>> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Email is required"));
        }
        String otp = otpService.generateAndSendOtp(email);
        Map<String, String> response = Map.of(
            "message", "New verification code: " + otp,
            "otp", otp
        );
        return ResponseEntity.ok(response);
    }
}
