package com.foodDelivery.order_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DriverAssignedEvent {
    private String orderId;
    private String driverId;
    private String driverName;
    private String driverPhone;
    private Integer estimatedMins;
}
