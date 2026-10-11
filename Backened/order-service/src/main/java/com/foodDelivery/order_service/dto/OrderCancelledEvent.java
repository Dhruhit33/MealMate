package com.foodDelivery.order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data

public class OrderCancelledEvent {

    private  String orderId;
    private String userId ;
    private String restaurantId;
    private String reason ;
    private LocalDateTime cancelledAt;

}
