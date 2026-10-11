package com.foodDelivery.ai_assistant_service.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * {@link RequestContext}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ObjectProvider<RequestContext> requestContextProvider;
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (path.startsWith("/actuator") || path.startsWith("/api/v1/ai/health")) {
            chain.doFilter(request, response);
            return;
        }
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtService.isValid(token)) {
                try {
                    RequestContext ctx = requestContextProvider.getObject();
                    ctx.setJwt(token);
                    ctx.setUserId(jwtService.extractUserId(token));
                    ctx.setEmail(jwtService.extractEmail(token));
                    ctx.setRole(jwtService.extractRole(token));
                } catch (Exception e) {
                    log.warn("Failed to populate RequestContext: {}", e.getMessage());
                }
            } else {
                log.warn("Invalid JWT on path={}", path);
            }
        }
        chain.doFilter(request, response);
    }
}
