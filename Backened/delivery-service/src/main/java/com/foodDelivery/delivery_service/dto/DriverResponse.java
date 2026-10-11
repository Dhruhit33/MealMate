package com.foodDelivery.delivery_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverResponse {

    private String driverId ;
    private String userId ;
    private String name ;
    private String phone ;
    private String vehicleType ;
    private String vehicleNumber ;
    private String status ;
    private BigDecimal currentLatitude;
    private BigDecimal currentLongitude;
    private BigDecimal avgRating;
    private Integer totalDeliveries;

}
