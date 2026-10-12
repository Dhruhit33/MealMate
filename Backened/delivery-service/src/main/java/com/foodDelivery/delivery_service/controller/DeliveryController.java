package com.foodDelivery.delivery_service.controller;

import com.foodDelivery.delivery_service.dto.DeliveryResponse;
import com.foodDelivery.delivery_service.repository.DriverRepo;
import com.foodDelivery.delivery_service.service.DeliveryService;
import com.foodDelivery.delivery_service.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final JwtService jwtService;
    private final DriverRepo driverRepository;

    //get delivery status for an order
    @GetMapping("/{orderId}/status")
    public ResponseEntity<?> getDeliveryStatus(@PathVariable String orderId ){
        DeliveryResponse response = deliveryService.getDeliveryByOrderId(orderId);
        return ResponseEntity.ok(response);
    }
    //get Delivery history for logged in customer
    @GetMapping("/my-deliveries")
    public  ResponseEntity<?> getMyDeliveries(@RequestHeader("Authorization") String authHeader){
        String userId = extractUserId(authHeader);
        List<DeliveryResponse> deliveries = deliveryService.getAllDeliveriesByUserId(userId);
        return ResponseEntity.ok(Map.of(
                "count", deliveries.size(),
                "deliveries", deliveries
        ));

    }
    @GetMapping("/active")
    public ResponseEntity<?> getActiveDeliveries(@RequestHeader("Authorization") String authHeader) {
        String userId = extractUserId(authHeader);
        List<DeliveryResponse> deliveries = deliveryService.getActiveDeliveryByUserId(userId);
        return ResponseEntity.ok(Map.of(
                "count", deliveries.size(),
                "deliveries", deliveries
        ));
    }

    /**
     * GET /delivery/driver/active
     * Get the current active delivery for the logged-in driver.
     */
    @GetMapping("/driver/active")
    public ResponseEntity<?> getDriverActiveDelivery(@RequestHeader("Authorization") String authHeader) {
        String userId = extractUserId(authHeader);
        String driverId = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Driver profile not found"))
                .getDriverId();

        DeliveryResponse response = deliveryService.getActiveDeliveryForDriver(driverId);
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    /**
     * GET /delivery/driver/history
     * Get delivery history for the logged-in driver.
     */
    @GetMapping("/driver/history")
    public ResponseEntity<?> getDriverDeliveryHistory(@RequestHeader("Authorization") String authHeader) {
        String userId = extractUserId(authHeader);
        String driverId = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Driver profile not found"))
                .getDriverId();

        List<DeliveryResponse> deliveries = deliveryService.getDeliveryHistoryForDriver(driverId);
        return ResponseEntity.ok(Map.of(
                "count", deliveries.size(),
                "deliveries", deliveries
        ));
    }

    /**
     * POST /delivery/decline
     * Driver declines / rejects assigned delivery request.
     */
    @PostMapping("/decline")
    public ResponseEntity<?> declineDelivery(@RequestHeader("Authorization") String authHeader) {
        String userId = extractUserId(authHeader);
        String driverId = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Driver profile not found"))
                .getDriverId();

        DeliveryResponse response = deliveryService.declineDelivery(driverId);
        return ResponseEntity.ok(Map.of(
                "message", "Delivery request declined. You are back online.",
                "delivery", response
        ));
    }

    /**
     * POST /delivery/pickup
     * Driver confirms food pickup from restaurant.
     */
    @PostMapping("/pickup")
    public ResponseEntity<?> confirmPickup(@RequestHeader("Authorization") String authHeader) {
        String userId = extractUserId(authHeader);
        String driverId = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Driver profile not found"))
                .getDriverId();

        DeliveryResponse response = deliveryService.confirmPickup(driverId);
        return ResponseEntity.ok(Map.of(
                "message", "Pickup confirmed. Head to the customer now!",
                "delivery", response
        ));
    }

    /**
     * POST /delivery/complete
     * Driver confirms delivery to customer.
     */
    @PostMapping("/complete")
    public ResponseEntity<?> completeDelivery(@RequestHeader("Authorization") String authHeader) {
        String userId = extractUserId(authHeader);
        String driverId = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Driver profile not found"))
                .getDriverId();

        DeliveryResponse response = deliveryService.completeDelivery(driverId);
        return ResponseEntity.ok(Map.of(
                "message", "Delivery completed successfully!",
                "delivery", response
        ));
    }

    @PostMapping("/order/{orderId}/rate-driver")
    public ResponseEntity<?> rateDriverByOrder(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> body) {
        int rating = body.get("rating") != null ? Integer.parseInt(body.get("rating").toString()) : 5;
        String comment = body.get("comment") != null ? body.get("comment").toString() : "";
        deliveryService.rateDriver(orderId, rating, comment);
        return ResponseEntity.ok(Map.of("message", "Driver rated successfully"));
    }

    @PostMapping("/{deliveryId}/rate-driver")
    public ResponseEntity<?> rateDriver(
            @PathVariable String deliveryId,
            @RequestBody Map<String, Object> body) {
        int rating = body.get("rating") != null ? Integer.parseInt(body.get("rating").toString()) : 5;
        String comment = body.get("comment") != null ? body.get("comment").toString() : "";
        deliveryService.rateDriver(deliveryId, rating, comment);
        return ResponseEntity.ok(Map.of("message", "Driver rated successfully"));
    }

    private String extractUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return jwtService.extractUserId(token);
    }


}
