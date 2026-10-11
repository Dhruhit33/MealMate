package com.foodDelivery.delivery_service.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
public class DeliveryResponse {

    private String deliveryId ;
    private String orderId ;
    private String userId ;
    private String restaurantId;
    private String restaurantName ;
    private String driverId;
    private String driverName ;
    private String driverPhone;
    private String status ;
    private String pickupAddress;
    private String  dropoffAddress;
    private String deliveryAddress;  // alias for dropoffAddress — used by frontend
    private Integer estimatedDeliveryMins;
    private Integer actualDeliveryMins;
    private BigDecimal distanceKm;
    private BigDecimal deliveryFee;  // computed delivery fee — used by frontend for earnings
    private BigDecimal driverLatitude;
    private BigDecimal driverLongitude;
    private LocalDateTime assignedAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime createdAt;

}
