package com.foodDelivery.order_service.dto;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateStatusRequest {


    private String status;

    private String driverId;         // Set when assigning a driver
    private Integer estimatedMins;   // Update ETA
    private String reason;           // For cancellation

}
