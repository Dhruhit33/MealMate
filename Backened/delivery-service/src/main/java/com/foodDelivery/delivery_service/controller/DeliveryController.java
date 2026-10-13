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

    //get all registered/available drivers within radius (default 25km)
    @GetMapping("/available-drivers")
    public ResponseEntity<?> getAvailableDrivers(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(defaultValue = "25.0") double radius) {
        return ResponseEntity.ok(driverRepository.findAll().stream().map(d -> {
            Double distanceKm = null;
            if (lat != null && lng != null && d.getCurrentLatitude() != null && d.getCurrentLongitude() != null) {
                distanceKm = com.foodDelivery.delivery_service.service.DriverMatchingService.calculateHaversineKm(
                        lat, lng,
                        d.getCurrentLatitude().doubleValue(),
                        d.getCurrentLongitude().doubleValue());
            }
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("driverId", d.getDriverId() != null ? d.getDriverId() : "");
            map.put("name", d.getName() != null ? d.getName() : "Rider");
            map.put("phone", d.getPhone() != null ? d.getPhone() : "");
            map.put("status", d.getStatus() != null ? d.getStatus().name() : "ONLINE");
            map.put("vehicleType", d.getVehicleType() != null ? d.getVehicleType() : "MOTORCYCLE");
            map.put("vehicleNumber", d.getVehicleNumber() != null ? d.getVehicleNumber() : "");
            map.put("avgRating", d.getAvgRating() != null ? d.getAvgRating() : java.math.BigDecimal.valueOf(5.0));
            map.put("totalDeliveries", d.getTotalDeliveries() != null ? d.getTotalDeliveries() : 0);
            map.put("latitude", d.getCurrentLatitude());
            map.put("longitude", d.getCurrentLongitude());
            map.put("distanceKm", distanceKm);
            return map;
        })
        .filter(d -> {
            if (lat != null && lng != null) {
                Double dist = (Double) d.get("distanceKm");
                return dist != null && dist <= radius;
            }
            return true;
        })
        .sorted((a, b) -> {
            Double da = (Double) a.get("distanceKm");
            Double db = (Double) b.get("distanceKm");
            if (da != null && db != null) {
                return Double.compare(da, db);
            }
            return 0;
        })
        .toList());
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
     * POST /delivery/accept
     * Driver accepts delivery request.
     */
    @PostMapping("/accept")
    public ResponseEntity<?> acceptDelivery(@RequestHeader("Authorization") String authHeader) {
        String userId = extractUserId(authHeader);
        String driverId = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Driver profile not found"))
                .getDriverId();

        DeliveryResponse response = deliveryService.acceptDelivery(driverId);
        return ResponseEntity.ok(Map.of(
                "message", "Delivery request accepted! Navigate to restaurant.",
                "delivery", response
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
