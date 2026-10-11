package com.foodDelivery.delivery_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPickedUpEvent {

    private String deliveryId ;
    private String orderId ;
    private String driverId ;
    private Integer estimatedMins ;
    private LocalDateTime pickedUpAt;

}
