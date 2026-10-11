package com.foodDelivery.delivery_service.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class DeliveryCompletedEvent {

    private String deliveryId;
    private String orderId;
    private String userId;
    private String restaurantId;
    private String driverId;
    private BigDecimal distanceKm;
    private Integer actualDeliveryMins;
    private LocalDateTime deliveredAt;
    private String userEmail;
    private String userName;



}
