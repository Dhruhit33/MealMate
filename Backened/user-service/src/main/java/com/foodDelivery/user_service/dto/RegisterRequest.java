package com.foodDelivery.user_service.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private  String name ;
    private  String email ;
    private  String phone ;
    private  String password ;
    private String  role ; // customer , Driver , RestrauentOwner

}
