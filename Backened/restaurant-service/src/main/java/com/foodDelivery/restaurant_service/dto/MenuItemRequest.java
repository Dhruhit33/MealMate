package com.foodDelivery.restaurant_service.dto;


import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;


import java.math.BigDecimal;


@Data
public class MenuItemRequest {

    @NotNull(message = "item name is required ")
    private String name ;

    private String description;

    @NotNull(message = "price is required ")
    @Positive(message = "price must be positive ")
    private BigDecimal price ;

    private String categoryId;
    private String imageUrl;
    private Boolean isVeg = true;
    private Boolean isBestseller = false;


}
