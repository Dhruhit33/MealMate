package com.foodDelivery.order_service.controller;

import com.foodDelivery.order_service.dto.CartItemRequest;
import com.foodDelivery.order_service.dto.CartResponse;
import com.foodDelivery.order_service.service.CartService;
import com.foodDelivery.order_service.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final JwtService jwtService;


    @PostMapping("/add")
    public ResponseEntity<CartResponse> addItem(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody CartItemRequest request) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(cartService.addItem(userId, request));
    }


    @PutMapping("/update/{menuItemId}")
    public ResponseEntity<CartResponse> updateQuantity(
            @RequestHeader("Authorization") String token,
            @PathVariable String menuItemId,
            @RequestParam int quantity) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(cartService.updateQuantity(userId, menuItemId, quantity));
    }


    @DeleteMapping("/remove/{menuItemId}")
    public ResponseEntity<CartResponse> removeItem(
            @RequestHeader("Authorization") String token,
            @PathVariable String menuItemId) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(cartService.removeItem(userId, menuItemId));
    }


    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @RequestHeader("Authorization") String token) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(cartService.getCart(userId));
    }


    @DeleteMapping("/clear")
    public ResponseEntity<String> clearCart(
            @RequestHeader("Authorization") String token) {

        String userId = extractUserId(token);
        cartService.clearCart(userId);
        return ResponseEntity.ok("Cart cleared");
    }

    private String extractUserId(String token) {
        return jwtService.extractUserId(token.replace("Bearer ", ""));
    }
}
