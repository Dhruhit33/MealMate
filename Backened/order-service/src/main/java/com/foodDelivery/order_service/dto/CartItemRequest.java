package com.foodDelivery.order_service.dto;


import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CartItemRequest {

    private String menuItemId;
    private String menuItemName ;

    @Positive
    private BigDecimal unitPrice;

    private Integer quantity;


    private String restaurantId;
    private String restaurantName ;
}
