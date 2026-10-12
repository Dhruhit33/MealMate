package com.foodDelivery.delivery_service.kafka.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverLocationEvent implements Serializable {
    private String driverId;
    private String orderId;
    private Double latitude;
    private Double longitude;
    private String region; // "ahmedabad", "gandhinagar", "rajkot", "surat", "vadodara"
    private Long timestamp;
}
