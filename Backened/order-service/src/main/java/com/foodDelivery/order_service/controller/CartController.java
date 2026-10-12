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
            @RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @RequestHeader(value = "Authorization", required = false) String token,
            @Valid @RequestBody CartItemRequest request) {

        String userId = resolveUserId(xUserId, token);
        return ResponseEntity.ok(cartService.addItem(userId, request));
    }


    @PutMapping("/update/{menuItemId}")
    public ResponseEntity<CartResponse> updateQuantity(
            @RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable String menuItemId,
            @RequestParam int quantity) {

        String userId = resolveUserId(xUserId, token);
        return ResponseEntity.ok(cartService.updateQuantity(userId, menuItemId, quantity));
    }


    @DeleteMapping("/remove/{menuItemId}")
    public ResponseEntity<CartResponse> removeItem(
            @RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable String menuItemId) {

        String userId = resolveUserId(xUserId, token);
        return ResponseEntity.ok(cartService.removeItem(userId, menuItemId));
    }


    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @RequestHeader(value = "Authorization", required = false) String token) {

        String userId = resolveUserId(xUserId, token);
        return ResponseEntity.ok(cartService.getCart(userId));
    }


    @DeleteMapping("/clear")
    public ResponseEntity<String> clearCart(
            @RequestHeader(value = "X-User-Id", required = false) String xUserId,
            @RequestHeader(value = "Authorization", required = false) String token) {

        String userId = resolveUserId(xUserId, token);
        cartService.clearCart(userId);
        return ResponseEntity.ok("Cart cleared");
    }

    private String resolveUserId(String xUserId, String token) {
        if (xUserId != null && !xUserId.isBlank()) return xUserId;
        if (token != null && !token.isBlank()) return jwtService.extractUserId(token.replace("Bearer ", ""));
        return null;
    }
}
