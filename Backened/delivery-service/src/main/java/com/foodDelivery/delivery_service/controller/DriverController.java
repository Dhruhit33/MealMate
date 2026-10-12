package com.foodDelivery.delivery_service.controller;

import com.foodDelivery.delivery_service.dto.DriverRegistrationRequest;
import com.foodDelivery.delivery_service.dto.DriverResponse;
import com.foodDelivery.delivery_service.dto.LocationPayload;
import com.foodDelivery.delivery_service.service.DeliveryService;
import com.foodDelivery.delivery_service.service.DriverMatchingService;
import com.foodDelivery.delivery_service.service.JwtService;
import com.foodDelivery.delivery_service.service.TrackingService;
import com.foodDelivery.delivery_service.kafka.DriverLocationProducer;
import com.foodDelivery.delivery_service.kafka.event.DriverLocationEvent;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/driver")
@RequiredArgsConstructor

public class DriverController {
    private final DeliveryService deliveryService;
    private final DriverMatchingService driverMatchingService;
    private final TrackingService trackingService;
    private final JwtService jwtService;
    private final DriverLocationProducer driverLocationProducer;

    //driver register
    @PostMapping("/register")
    public ResponseEntity<?> registerDriver(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody DriverRegistrationRequest request
    ){
        String userId = extractUserId(authHeader);
        DriverResponse response = deliveryService.registerDriver(userId,request);
        return ResponseEntity.ok(Map.of(
                "message", "Driver registered successfully",
                "driver", response
        ));
    }

//    ?? mark driver as available for deliveries

    @PostMapping("/go-online")
    public ResponseEntity<?> goOnline(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam double latitude,
            @RequestParam double longitude) {

        String userId = extractUserId(authHeader);
        DriverResponse response = deliveryService.goOnline(userId, latitude, longitude);
        return ResponseEntity.ok(Map.of(
                "message", "You are now online and available for deliveries",
                "driver", response
        ));
    }

    //mark driver as offline
    @PostMapping("/go-offline")
    public ResponseEntity<?> goOffline(@RequestHeader("Authorization") String authHeader) {
        String userId = extractUserId(authHeader);
        DriverResponse response = deliveryService.goOffline(userId);
        return ResponseEntity.ok(Map.of(
                "message", "You are now offline",
                "driver", response
        ));
    }

    /**
     * POST /driver/location
     * Update driver location via REST (alternative to WebSocket).
     * For drivers on HTTP polling instead of WebSocket.
     */
    @PostMapping("/location")
    public ResponseEntity<?> updateLocation(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody LocationPayload payload) {

        if (payload.getDriverId() == null || payload.getLatitude() == null || payload.getLongitude() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "driverId, latitude, and longitude are required"));
        }

        // Publish to Regional Kafka Topic (Partitioned by driverId)
        driverLocationProducer.publishLocation(DriverLocationEvent.builder()
                .driverId(payload.getDriverId())
                .orderId(payload.getOrderId())
                .latitude(payload.getLatitude())
                .longitude(payload.getLongitude())
                .region(payload.getRegion())
                .timestamp(payload.getTimestamp() != null ? payload.getTimestamp() : System.currentTimeMillis())
                .build());

        String resolved = DriverLocationProducer.resolveRegion(payload.getLatitude(), payload.getLongitude(), payload.getRegion());
        return ResponseEntity.ok(Map.of("message", "Location published to Kafka", "region", resolved));
    }

    /**
     * GET /driver/profile
     * Get current driver profile and status.
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authHeader) {
        String userId = extractUserId(authHeader);
        DriverResponse response = deliveryService.getDriverProfile(userId);
        return ResponseEntity.ok(response);
    }



    private String extractUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return jwtService.extractUserId(token);
    }


}
