package com.foodDelivery.restaurant_service.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderAcceptedEvent {

    private String orderId ;
    private String restaurantId;
    private String restaurantName ;
    private Integer estimatedPrepTimeMins;
    private LocalDateTime acceptedAt;

}
