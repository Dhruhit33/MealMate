package com.fooddelivery.api_gateway.filter;

import com.fooddelivery.api_gateway.config.JwtUtil;
import com.fooddelivery.api_gateway.config.RouteValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private final RouteValidator routeValidator;
    private final JwtUtil jwtUtil;

    public AuthenticationFilter(RouteValidator routeValidator, JwtUtil jwtUtil) {
        super(Config.class);
        this.routeValidator = routeValidator;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            HttpHeaders headers = exchange.getRequest().getHeaders();

            // If token is present, validate it and attach user headers
            if (headers.containsKey(HttpHeaders.AUTHORIZATION)) {
                String authHeader = headers.getFirst(HttpHeaders.AUTHORIZATION);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    if (jwtUtil.isTokenValid(token)) {
                        String userId = jwtUtil.extractUserId(token);
                        String email  = jwtUtil.extractEmail(token);
                        String role   = jwtUtil.extractRole(token);

                        ServerWebExchange mutated = exchange.mutate()
                                .request(r -> r
                                        .header("X-User-Id", userId == null ? "" : userId)
                                        .header("X-User-Email", email == null ? "" : email)
                                        .header("X-User-Role", role == null ? "" : role))
                                .build();

                        return chain.filter(mutated);
                    } else if (routeValidator.isSecured(exchange)) {
                        return onError(exchange, "Invalid or expired JWT token", HttpStatus.UNAUTHORIZED);
                    }
                } else if (routeValidator.isSecured(exchange)) {
                    return onError(exchange, "Invalid Authorization header format", HttpStatus.UNAUTHORIZED);
                }
            }

            // If endpoint is secured and no authorization header was provided
            if (routeValidator.isSecured(exchange)) {
                return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
            }

            return chain.filter(exchange);
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        log.warn("Auth failed: {}", message);
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");
        
        String responseBody = String.format("{\"error\":\"%s\", \"message\":\"%s\", \"status\":%d}", 
                message, message, status.value());
        
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse()
                .bufferFactory().wrap(responseBody.getBytes())));
    }

    public static class Config { }
}