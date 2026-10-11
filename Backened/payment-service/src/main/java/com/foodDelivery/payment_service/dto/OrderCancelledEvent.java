package com.foodDelivery.payment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCancelledEvent {
    private String orderId ;
    private String userId ;
    private String restaurantId ;
    private String reason ;
    private LocalDateTime cancelledAt ;
}
