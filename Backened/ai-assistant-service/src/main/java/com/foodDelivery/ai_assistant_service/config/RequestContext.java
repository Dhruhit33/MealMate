package com.foodDelivery.ai_assistant_service.config;


import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Component
@RequestScope
@Getter
@Setter
public class RequestContext {

    private String jwt ;
    private String userId ;
    private String email ;
    private String role;


    public  String bearer(){
        return  jwt ==null ? null : "Bearer " + jwt;
    }
}
