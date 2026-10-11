package com.foodDelivery.delivery_service.websockets;

import com.foodDelivery.delivery_service.dto.LocationPayload;
import com.foodDelivery.delivery_service.service.DriverMatchingService;
import com.foodDelivery.delivery_service.service.TrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
@RequiredArgsConstructor
public class LocationWebSocket {
    private final DriverMatchingService driverMatchingService;
    private final TrackingService trackingService;

    // driver send location update via webSockets stomp
    // matches frontend socketService.sendDriverLocation() → "/app/driver-location"

    @MessageMapping("/driver-location")
    public void updateDriverLocation(LocationPayload payload){
        log.debug("Location update: driverId={}, lat={}, lng={}",
                payload.getDriverId(),payload.getLatitude(),payload.getLongitude());
        //save to Redis geo for matching
        driverMatchingService.updateDriverLocation(
                payload.getDriverId(),
                payload.getLatitude(),
                payload.getLongitude()
        );
        //broadcast to user watching deliveries
        trackingService.broadcastDriverLocation(
                payload.getDriverId(),
                payload.getLatitude(),
                payload.getLongitude()
        );

    }
}
