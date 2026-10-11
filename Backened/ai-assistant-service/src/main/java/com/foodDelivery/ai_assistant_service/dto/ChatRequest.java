package com.foodDelivery.ai_assistant_service.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {


    @NotBlank(message = "Message can't be empty")
    @Size(max = 2000 , message = "message too long (max 2000 chars )")
    private String message ;

    private String conversationId ;


}
