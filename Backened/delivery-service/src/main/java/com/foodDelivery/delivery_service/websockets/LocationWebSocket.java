package com.foodDelivery.delivery_service.websockets;

import com.foodDelivery.delivery_service.dto.LocationPayload;
import com.foodDelivery.delivery_service.kafka.DriverLocationProducer;
import com.foodDelivery.delivery_service.kafka.event.DriverLocationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
@RequiredArgsConstructor
public class LocationWebSocket {
    private final DriverLocationProducer driverLocationProducer;

    // Driver sends location update via WebSockets stomp
    // matches frontend socketService.sendDriverLocation() → "/app/driver-location"
    @MessageMapping("/driver-location")
    public void updateDriverLocation(LocationPayload payload){
        if (payload.getDriverId() == null || payload.getLatitude() == null || payload.getLongitude() == null) {
            return;
        }
        log.debug("Location update received via WebSocket: driverId={}, lat={}, lng={}, region={}",
                payload.getDriverId(), payload.getLatitude(), payload.getLongitude(), payload.getRegion());

        // Publish to Regional Kafka Topic (Partitioned by driverId)
        driverLocationProducer.publishLocation(DriverLocationEvent.builder()
                .driverId(payload.getDriverId())
                .orderId(payload.getOrderId())
                .latitude(payload.getLatitude())
                .longitude(payload.getLongitude())
                .region(payload.getRegion())
                .timestamp(payload.getTimestamp() != null ? payload.getTimestamp() : System.currentTimeMillis())
                .build());
    }
}
