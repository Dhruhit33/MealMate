package com.foodDelivery.delivery_service.service;


import com.foodDelivery.delivery_service.domain.Delivery;
import com.foodDelivery.delivery_service.domain.Driver;
import com.foodDelivery.delivery_service.dto.LocationUpdate;
import com.foodDelivery.delivery_service.repository.DeliveryRepo;
import com.foodDelivery.delivery_service.repository.DriverRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class TrackingService {

    private  final SimpMessagingTemplate messagingTemplate;
    private final DeliveryRepo deliveryRepo;
    private final DriverRepo driverRepo;
    private final ETAService etaService;

    // brodcast driver location to the user watching a specific order
    // git location update in every 3 sec

    public  void broadcastDriverLocation ( String driverId , double latitude , double longitude ){

        // find the active delivery for this order

        Optional<Delivery> activeDelivery = deliveryRepo.findActiveDeliveryByDriverId(driverId);

        if (activeDelivery.isEmpty()){
            log.debug("No active delivery for driver {}, skipping broadcast", driverId);
            return ;

        }

        Delivery delivery = activeDelivery.get();
        Optional<Driver> driverOpt = driverRepo.findById(driverId);
        //calculate live eta to customer
        int estimateMins =0 ;
        if (delivery.getDropoffLatitude() != null && delivery.getDropoffLongitude() != null) {
            estimateMins = etaService.calculateETAfromDriver(
                    latitude, longitude,
                    delivery.getDropoffLatitude().doubleValue(),
                    delivery.getDropoffLongitude().doubleValue()
            );
        }
        LocationUpdate update = LocationUpdate.builder()
                .latitude(latitude)
                .longitude(longitude)
                .estimatedMins(estimateMins)
                .driverName(driverOpt.map(Driver::getName).orElse("Driver"))
                .driverPhone(driverOpt.map(Driver::getPhone).orElse(null))
                .status(delivery.getStatus().name())
                .build();


        // push to webSocket topic — matches frontend socketService.subscribeToDriverLocation()
        String destination  = "/topic/driver-location/" +delivery.getOrderId();
        messagingTemplate.convertAndSend(destination,update);

        log.debug("Broadcast location for order {}: lat={}, lng={}, eta={}mins",
                delivery.getOrderId(),latitude,longitude,estimateMins);

    }
}
