package com.foodDelivery.delivery_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverRegistrationRequest {

    @NotBlank(message = "Name is required ")
    private String name ;


    @NotBlank(message = "Phone is required ")
    private String phone ;

    private String vehicleType ;   //bike scooky / car

    private String vehicleNum ;

}
