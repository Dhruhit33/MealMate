package com.foodDelivery.ai_assistant_service.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Data
public class ChatResponse {

    private String reply ;
    private String conversationId ;
    private List<String> toolsCalled ;
    private Instant timestamp ;
}
