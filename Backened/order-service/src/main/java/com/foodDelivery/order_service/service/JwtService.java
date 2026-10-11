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

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims extractClaims(String token ){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
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
