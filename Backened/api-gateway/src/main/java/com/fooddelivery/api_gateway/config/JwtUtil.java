package com.fooddelivery.api_gateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;


@Component
public class JwtUtil {


    @Value("${jwt.secret}")
    private String secret;

    private SecretKey getSigningKey(  ){
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public  boolean isTokenValid(String token ){
        try {
            extractClaims(token);
            return true;
        }catch (Exception ex ){
            return false ;
        }
    }

    public  String extractUserId  (String token ){
        return extractClaims(token).getSubject();
    }

    public  String extractRole(String token ){
        return  extractClaims(token).get("role", String.class);
    }

    public  String extractEmail(String token ){
        return extractClaims(token).get("email", String.class);

    }




}
