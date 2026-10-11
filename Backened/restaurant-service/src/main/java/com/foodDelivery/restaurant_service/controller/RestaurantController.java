package com.foodDelivery.restaurant_service.controller;

import com.foodDelivery.restaurant_service.dto.OrderAcceptedEvent;
import com.foodDelivery.restaurant_service.dto.RestaurantRequest;
import com.foodDelivery.restaurant_service.dto.RestaurantResponse;
import com.foodDelivery.restaurant_service.kafka.OrderAcceptedProducer;
import com.foodDelivery.restaurant_service.service.JwtService;
import com.foodDelivery.restaurant_service.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/restaurants")
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final JwtService jwtService;
    private final OrderAcceptedProducer orderAcceptedProducer;

    // ─── Create Restaurant (RESTAURANT_OWNER only) ─────────────────────

    @PostMapping
    public ResponseEntity<RestaurantResponse> create(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody RestaurantRequest request) {

        String userId = extractUserId(token);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(restaurantService.createRestaurant(userId, request));
    }

    // ─── Update Restaurant ─────────────────────────────────────────────

    @PutMapping("/{restaurantId}")
    public ResponseEntity<RestaurantResponse> update(
            @PathVariable String restaurantId,
            @RequestHeader("Authorization") String token,
            @RequestBody RestaurantRequest request) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(restaurantService.updateRestaurant(restaurantId, userId, request));
    }

    // ─── Get Restaurant by ID ──────────────────────────────────────────

    @GetMapping("/{restaurantId}")
    public ResponseEntity<RestaurantResponse> getById(@PathVariable String restaurantId) {
        return ResponseEntity.ok(restaurantService.getRestaurant(restaurantId));
    }

    // ─── Get My Restaurants (for owner dashboard) ──────────────────────

    @GetMapping("/my")
    public ResponseEntity<List<RestaurantResponse>> getMyRestaurants(
            @RequestHeader("Authorization") String token) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(restaurantService.getMyRestaurant(userId));
    }

    // ─── Toggle Open/Closed ────────────────────────────────────────────

    @PatchMapping("/{restaurantId}/toggle")
    public ResponseEntity<RestaurantResponse> toggleOpen(
            @PathVariable String restaurantId,
            @RequestHeader("Authorization") String token) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(restaurantService.toggleOpen(restaurantId, userId));
    }

    // ─── Search Restaurants (public) ───────────────────────────────────

    @GetMapping("/search")
    public ResponseEntity<List<RestaurantResponse>> search(
            @RequestParam String keyword) {
        return ResponseEntity.ok(restaurantService.search(keyword));
    }

    // ─── Nearby Restaurants (public) ───────────────────────────────────

    @GetMapping("/nearby")
    public ResponseEntity<List<RestaurantResponse>> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5") double radius,
            @RequestParam(required = false) String cuisine) {

        return ResponseEntity.ok(restaurantService.findNearBy(lat, lng, radius, cuisine));
    }

    // ─── Top Rated (public) ────────────────────────────────────────────

    @GetMapping("/top-rated")
    public ResponseEntity<List<RestaurantResponse>> topRated() {
        return ResponseEntity.ok(restaurantService.getTopRated());
    }

    // ─── Accept Order (Kafka produce) ──────────────────────────────────

    @PostMapping("/{restaurantId}/accept-order/{orderId}")
    public ResponseEntity<String> acceptOrder(
            @PathVariable String restaurantId,
            @PathVariable String orderId,
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "25") Integer prepTimeMins) {

        String userId = extractUserId(token);
        // Validate that the user owns this restaurant
        restaurantService.getRestaurant(restaurantId);

        OrderAcceptedEvent event = OrderAcceptedEvent.builder()
                .orderId(orderId)
                .restaurantId(restaurantId)
                .restaurantName(restaurantService.getRestaurant(restaurantId).getName())
                .estimatedPrepTimeMins(prepTimeMins)
                .acceptedAt(LocalDateTime.now())
                .build();

        orderAcceptedProducer.sendOrderAccepted(event);

        return ResponseEntity.ok("Order " + orderId + " accepted. Estimated prep time: " + prepTimeMins + " mins");
    }

    // ─── Delete Restaurant ─────────────────────────────────────────────

    @DeleteMapping("/{restaurantId}")
    public ResponseEntity<String> delete(
            @PathVariable String restaurantId,
            @RequestHeader("Authorization") String token) {

        String userId = extractUserId(token);
        restaurantService.deleteRestaurant(restaurantId, userId);
        return ResponseEntity.ok("Restaurant deleted");
    }

    // ─── Helper ────────────────────────────────────────────────────────

    private String extractUserId(String token) {
        return jwtService.extractUserId(token.replace("Bearer ", ""));
    }
}
