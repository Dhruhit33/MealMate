package com.fooddelivery.api_gateway.config;

import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
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
            "/api/v1/restaurants/top-rated",
            "/api/v1/delivery/available-drivers"
    );

    public boolean isSecured(ServerWebExchange exchange) {
        String path = exchange.getRequest().getURI().getPath();
        HttpMethod method = exchange.getRequest().getMethod();

        if (path.startsWith("/api/v1/auth") || path.startsWith("/eureka") || path.startsWith("/actuator") || path.startsWith("/api/v1/delivery/available-drivers")) {
            return false;
        }

        // Restaurant owner specific endpoint must be secured
        if (path.equals("/api/v1/restaurants/my")) {
            return true;
        }

        // Public GET browsing for restaurants, menus, categories
        if (HttpMethod.GET.equals(method) && path.startsWith("/api/v1/restaurants")) {
            return false;
        }

        return openApiEndpoints.stream().noneMatch(path::startsWith);
    }

    public boolean isSecured(String path) {
        return openApiEndpoints.stream().noneMatch(path::startsWith);
    }
}