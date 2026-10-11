package com.foodDelivery.order_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor

public class CartResponse {

    private String userId;
    private String restaurantId;
    private String restaurantName ;
    private List<CartItemResponse> item ;
    private BigDecimal subTotal;
    private BigDecimal deliveryFee;
    private BigDecimal total;
    private Integer itemCount ;


}
