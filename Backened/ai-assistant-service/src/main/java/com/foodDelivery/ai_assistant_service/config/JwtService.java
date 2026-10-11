package com.foodDelivery.ai_assistant_service.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class JwtService {
    @Value("${jwt.secret}")
    private String secret;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims extractClaims(String token){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    public  String extractUserId(String token ){
        return extractClaims(stripBearer(token)).getSubject();
    }

    public  String extractRole(String token ){
        return extractClaims(stripBearer(token)).get("role", String.class);
    }
    public  String extractEmail(String token){
        return extractClaims(stripBearer(token)).get("email", String.class);
    }

    public  boolean isValid(String token ){
        try{
            extractClaims(token);
            return  true ;
        }catch (Exception e){
            log.warn("JWT validation failed: {}", e.getMessage());
              return false;
        }
    }

    //Helper
    private String stripBearer(String token ){
        if (token == null ) return  "";
        return  token.startsWith( "Bearer ") ? token.substring(7):token;
    }
}
