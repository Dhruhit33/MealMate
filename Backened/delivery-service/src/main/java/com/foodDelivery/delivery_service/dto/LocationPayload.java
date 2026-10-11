package com.foodDelivery.delivery_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationPayload {
    private String driverId ;
    private Double latitude ;
    private Double longitude ;

}
