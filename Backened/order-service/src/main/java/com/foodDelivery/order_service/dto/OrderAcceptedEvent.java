package com.foodDelivery.order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor

public class OrderAcceptedEvent {

    private  String orderId;
    private String restaurantId;
    private String restaurantName ;
    private Integer estimatedPrepTimeMins;
    private LocalDateTime acceptedAt;


}
