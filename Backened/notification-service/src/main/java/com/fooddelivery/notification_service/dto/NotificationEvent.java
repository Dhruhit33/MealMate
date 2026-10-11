package com.fooddelivery.notification_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class NotificationEvent {
    private String orderId;
    private String userEmail;
    private String userName;
    private String restaurantName;
    private BigDecimal totalAmount;   // matches BigDecimal in both OrderPlacedEvent and PaymentCompletedEvent
    private String status;
}
