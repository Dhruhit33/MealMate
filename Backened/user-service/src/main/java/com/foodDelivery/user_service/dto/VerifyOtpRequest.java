package com.foodDelivery.user_service.dto;

import lombok.Data;

@Data
public class VerifyOtpRequest {
    private String email;
    private String otp ;
}
