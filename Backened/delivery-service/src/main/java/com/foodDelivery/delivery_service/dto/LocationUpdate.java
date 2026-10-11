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
public class LocationUpdate {

    private Double longitude ;
    private Double latitude ;
    private Integer estimatedMins ;
    private String driverName ;
    private String driverPhone ;
    private String status ;

}
