package com.foodDelivery.order_service.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import io.jsonwebtoken.security.Keys;


import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;


@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    private static final String FALLBACK_SECRET_1 = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final String FALLBACK_SECRET_2 = "default-secret-key-for-jwt-signing-must-be-at-least-256-bits-long";

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims extractClaims(String token ){
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception ex) {
            try {
                return Jwts.parser()
                        .verifyWith(Keys.hmacShaKeyFor(FALLBACK_SECRET_1.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
            } catch (Exception ex2) {
                return Jwts.parser()
                        .verifyWith(Keys.hmacShaKeyFor(FALLBACK_SECRET_2.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
            }
        }
    }

    public String extractUserId(String token){
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token ){
        return extractClaims(token).get("role" , String.class);
    }

    public String extractEmail(String token){
        return extractClaims(token).get("email", String.class);
    }

    public boolean isTokenValid(String token ){
        try{
            extractClaims(token);
            return true;
        }
        catch(Exception ex){
            return false ;
        }
    }




}
