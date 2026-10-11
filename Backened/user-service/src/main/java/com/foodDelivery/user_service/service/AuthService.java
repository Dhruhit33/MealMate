package com.foodDelivery.user_service.service;

import com.foodDelivery.user_service.domain.User;
import com.foodDelivery.user_service.dto.*;
import com.foodDelivery.user_service.exception.DuplicateResourceException;
import com.foodDelivery.user_service.exception.InvalidCredentialsException;
import com.foodDelivery.user_service.exception.ResourceNotFoundException;
import com.foodDelivery.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final StringRedisTemplate redisTemplate;

    private static final String PENDING_PREFIX = "pending:";

    public String initiateRegistration(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicateResourceException("Phone already registered");
        }

        String key = PENDING_PREFIX + request.getEmail();
        String value = String.join("|",
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                passwordEncoder.encode(request.getPassword()),
                request.getRole()
        );
        redisTemplate.opsForValue().set(key, value, 10, TimeUnit.MINUTES);

        otpService.generateAndSendOtp(request.getEmail());

        return "OTP sent to " + request.getEmail();
    }

    public AuthResponse verifyOtpAndRegister(VerifyOtpRequest request) {
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new InvalidCredentialsException("Invalid or expired OTP");
        }

        String key = PENDING_PREFIX + request.getEmail();
        String data = redisTemplate.opsForValue().get(key);
        if (data == null) {
            throw new ResourceNotFoundException("Registration expired. Please register again.");
        }

        String[] parts = data.split("\\|");
        User user = User.builder()
                .name(parts[0])
                .email(parts[1])
                .phone(parts[2])
                .password(parts[3])
                .role(User.Role.valueOf(parts[4]))
                .build();

        user = userRepository.save(user);
        redisTemplate.delete(key);

        String token = jwtService.generateToken(user.getUserId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getUserId(), user.getName(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid password");
        }

        String token = jwtService.generateToken(user.getUserId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getUserId(), user.getName(), user.getEmail(), user.getRole().name());
    }
}