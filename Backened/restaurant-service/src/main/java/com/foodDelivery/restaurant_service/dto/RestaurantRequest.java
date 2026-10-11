package com.foodDelivery.restaurant_service.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
public class RestaurantRequest {

    @NotBlank(message = "Restaurant name is required ")
    private String name;

    private String description ;

    @NotBlank(message = "Cuisine type is required")
    private String cuisineType;

    @NotBlank(message = "Address is required")
    private String address;

    @NotNull(message = "Latitude is required")
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    private BigDecimal longitude;

    private BigDecimal minOrderAmount;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private String imageUrl;
    private String phone;

}
