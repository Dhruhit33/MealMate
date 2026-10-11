package com.foodDelivery.order_service.controller;

import com.foodDelivery.order_service.dto.OrderResponse;
import com.foodDelivery.order_service.dto.PlaceOrderRequest;
import com.foodDelivery.order_service.dto.UpdateStatusRequest;
import com.foodDelivery.order_service.service.JwtService;
import com.foodDelivery.order_service.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final JwtService jwtService;


    @PostMapping("/place")
    public ResponseEntity<OrderResponse> placeOrder(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody PlaceOrderRequest request) {

        String userId = extractUserId(token);
        String email = extractEmail(token);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.placeOrder(userId, email, request));
    }


    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(
            @PathVariable String orderId) {
        return ResponseEntity.ok(orderService.getOrder(orderId));
    }


    @GetMapping("/my")
    public ResponseEntity<List<OrderResponse>> getMyOrders(
            @RequestHeader("Authorization") String token) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(orderService.getMyOrders(userId));
    }


    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<OrderResponse>> getRestaurantOrders(
            @PathVariable String restaurantId) {
        return ResponseEntity.ok(orderService.getRestaurantOrders(restaurantId));
    }


    @GetMapping("/restaurant/{restaurantId}/active")
    public ResponseEntity<List<OrderResponse>> getActiveOrders(
            @PathVariable String restaurantId) {
        return ResponseEntity.ok(orderService.getActiveRestaurantOrders(restaurantId));
    }


    @PatchMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable String orderId,
            @Valid @RequestBody UpdateStatusRequest request) {

        return ResponseEntity.ok(orderService.updateStatus(orderId, request));
    }


    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable String orderId,
            @RequestHeader("Authorization") String token,
            @RequestParam(required = false) String reason) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(orderService.cancelOrder(orderId, userId, reason));
    }

    private String extractUserId(String token) {
        return jwtService.extractUserId(token.replace("Bearer ", ""));
    }

    private String extractEmail(String token) {
        return jwtService.extractEmail(token.replace("Bearer ", ""));
    }
}
