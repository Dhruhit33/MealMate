package com.foodDelivery.user_service.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AddressRequest {
    private String label;
    private String street;
    private String city;
    private String pincode;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private boolean isDefault;
}