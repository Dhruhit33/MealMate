package com.foodDelivery.restaurant_service.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class OrderPlacedEvent {

    private String orderId;
    private String userId;
    private String restaurantId;
    private BigDecimal totalAmount ;
    private String specialInstructions ;

}
