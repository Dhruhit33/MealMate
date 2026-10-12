package com.foodDelivery.order_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PlaceOrderRequest {

    private String deliveryAddressId;

    private String deliverAddress;
    private String specialInstructions;
    private String customerPhone;
    private String customerName;
    private BigDecimal latitude;
    private BigDecimal longitude;
}
