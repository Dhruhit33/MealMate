package com.foodDelivery.delivery_service.service;

import com.foodDelivery.delivery_service.domain.Delivery;
import com.foodDelivery.delivery_service.domain.DeliveryStatus;
import com.foodDelivery.delivery_service.domain.Driver;
import com.foodDelivery.delivery_service.domain.DriverStatus;
import com.foodDelivery.delivery_service.repository.DeliveryRepo;
import com.foodDelivery.delivery_service.repository.DriverRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class DeliveryScheduler {
    private  final DeliveryService deliveryService;
    private  final DeliveryRepo deliveryRepo;
    private  final DriverRepo driverRepo;
    private  final DriverMatchingService driverMatchingService;

    @Value("${delivery.auto-reassign.pickup-timeout-minutes:15}")
    private int pickupTimeoutMinutes;

    //every 30 Sec ...retry matching driver for pending deliveries
    @Scheduled(fixedRate = 30000)
    public  void  retryPendingDeliveries(){
        deliveryService.retryPendingDeliveries();
    }
    // Every 60 sec: check for drivers who haven't picked up within timeout
    @Scheduled(fixedRate = 60000)
    public void checkPickupTimeouts(){
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(pickupTimeoutMinutes);

        List<Delivery> timedOut = deliveryRepo.findAll().stream()
                .filter(d -> d.getStatus() == DeliveryStatus.DRIVER_ASSIGNED)
                .filter(d -> d.getAssignedAt() != null)
                .filter(d -> d.getAssignedAt().isBefore(cutoff))
                .toList();

        for (Delivery delivery : timedOut) {
            log.warn("Driver {} hasn't picked up order {} within {} minutes — reassigning",
                    delivery.getDriverId(), delivery.getOrderId(), pickupTimeoutMinutes);

            // Release the driver back to ONLINE and re-add to Redis GEO
            String oldDriverId = delivery.getDriverId();
            if (oldDriverId != null) {
                Optional<Driver> driverOpt = driverRepo.findById(oldDriverId);
                driverOpt.ifPresent(driver -> {
                    driver.setStatus(DriverStatus.ONLINE);
                    driverRepo.save(driver);
                    // Re-add to Redis GEO if they have a location
                    if (driver.getCurrentLatitude() != null && driver.getCurrentLongitude() != null) {
                        driverMatchingService.updateDriverLocation(
                                driver.getDriverId(),
                                driver.getCurrentLatitude().doubleValue(),
                                driver.getCurrentLongitude().doubleValue()
                        );
                    }
                    log.info("Driver {} released back to ONLINE after pickup timeout", oldDriverId);
                });
            }

            delivery.setStatus(DeliveryStatus.PENDING);
            delivery.setDriverId(null);
            delivery.setAssignedAt(null);
            deliveryRepo.save(delivery);

            // Will be picked up by retryPendingDeliveries on next cycle
        }
    }

}

