package com.foodDelivery.delivery_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverAssignedEvent {
    private String deliveryId ;
    private String orderId ;
    private String driverId ;
    private String driverName ;
    private String driverPhone ;
    private String vehicleType ;
    private String vehicleNumber ;
    private Integer estimatedMins ;
    private LocalDateTime assignedAt;

}
