package com.fooddelivery.api_gateway.config;

import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class RouteValidator {

    /**
     * Path prefixes that do NOT require a JWT token.
     * Everything under /api/v1/auth/** is open because that's where
     * register, login, OTP verification, password reset etc. live.
     */
    public static final List<String> openApiEndpoints = List.of(
            "/api/v1/auth",
            "/eureka",
            "/actuator",
            "/api/v1/restaurants/search",
            "/api/v1/restaurants/nearby",
            "/api/v1/restaurants/top-rated"  // ← add this

    );

    public boolean isSecured(String path) {
        return openApiEndpoints.stream().noneMatch(path::startsWith);
    }
}