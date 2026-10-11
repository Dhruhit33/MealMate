package com.foodDelivery.delivery_service.service;

import com.foodDelivery.delivery_service.domain.Delivery;
import com.foodDelivery.delivery_service.domain.DeliveryStatus;
import com.foodDelivery.delivery_service.domain.Driver;
import com.foodDelivery.delivery_service.domain.DriverStatus;
import com.foodDelivery.delivery_service.dto.*;
import com.foodDelivery.delivery_service.kafka.DeliveryEventProducer;
import com.foodDelivery.delivery_service.repository.DeliveryRepo;
import com.foodDelivery.delivery_service.repository.DriverRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class DeliveryService {
    private final DeliveryRepo deliveryRepo;
    private   final DriverRepo driverRepo;
    private  final DriverMatchingService driverMatchingService;
    private final ETAService etaService;
    private final DeliveryEventProducer eventProducer;
    /// ////------------Driver ManageMent --------------------------------------------//

    //---------------- Register for the driver profile ------------//


    @Transactional
    public DriverResponse registerDriver(String userId , DriverRegistrationRequest request){
        if (driverRepo.existsByUserId(userId)){
            throw  new IllegalStateException("Driver profile already exists for this user ");
        }
        Driver driver = Driver.builder()
                .driverId(UUID.randomUUID().toString())
                .userId(userId)
                .name(request.getName())
                .phone(request.getPhone())
                .vehicleType(request.getVehicleType())
                .vehicleNumber(request.getVehicleNum())
                .status(DriverStatus.OFFLINE)
                .avgRating(BigDecimal.ZERO)
                .totalDeliveries(0)
                .build();

        driver=driverRepo.save(driver);
        log.info("Driver registered: driverId={}, name={}", driver.getDriverId(), driver.getName());
        return toDriverResponse(driver);


    }


    // Driver goes Online - available for deliveries
    //required current location to add to redis Geo

    @Transactional
    public  DriverResponse goOnline(String userId , double lat , double lng){
        Driver driver=driverRepo.findByUserId(userId)
                .orElseThrow(()-> new IllegalStateException("Driver position not found. Register first"));

        driver.setStatus(DriverStatus.ONLINE);
        driver.setCurrentLatitude(BigDecimal.valueOf(lat));
        driver.setCurrentLongitude(BigDecimal.valueOf(lng));
        driverRepo.save(driver);

        //Add to Redis Geo for location -based matching
        driverMatchingService.updateDriverLocation(driver.getDriverId(), lat,lng);
        log.info("Driver online: driverId={}, location=({}, {})", driver.getDriverId(), lat, lng);
        return toDriverResponse(driver);
    }

    //Driver goes offline no longer available for deliveries

    @Transactional
    public  DriverResponse goOffline(String userId ){
        Driver driver = driverRepo.findByUserId(userId)
                .orElseThrow(()-> new IllegalStateException("Driver profile not found "));
        if(driver.getStatus()==DriverStatus.ASSIGNED || driver.getStatus()==DriverStatus.PICKED_UP){
            throw  new IllegalStateException("Cannot go offline while on an active delivery");
        }
        driver.setStatus(DriverStatus.OFFLINE);
        driverRepo.save(driver);

        //Remove from Redis Geo
        driverMatchingService.removeDriverLocation(driver.getDriverId());
        log.info("Driver offline: driverId={}", driver.getDriverId());
        return  toDriverResponse(driver);

    }

    //Get driver profile by userId
    public DriverResponse getDriverProfile(String userId ){
        Driver driver = driverRepo.findByUserId(userId)
                .orElseThrow(()->new IllegalStateException("Driver profile not found"));
        return toDriverResponse(driver);
    }

    /// //-----------------------------Delivery Lifecycle--------------------------------------//////

    //create a new delivery when order is placed

    @Transactional
    public Delivery createDelivery(OrderPlacedEvent event){
        Optional<Delivery> existing = deliveryRepo.findByOrderId(event.getOrderId());
        if (existing.isPresent()){
            log.warn("Delivery already exists for order {}, skipping", event.getOrderId());
            return existing.get();

        }

        Delivery delivery = Delivery.builder()
                .deliveryId(UUID.randomUUID().toString())
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .restaurantId(event.getRestaurantId())
                .restaurantName(event.getRestaurantName())
                .status(DeliveryStatus.PENDING)
                .dropoffAddress(event.getDeliveryAddress())
                .specialInstructions(event.getSpecialInstructions())
                .userEmail(event.getUserEmail())
                .userName(event.getUserName())
                .build();
        delivery=deliveryRepo.save(delivery);
        log.info("Delivery created: deliveryId={}, orderId={}", delivery.getDeliveryId(), event.getOrderId());

        attemptDriverAssignment(delivery);
        return delivery;

    }

    //Assigned to a driver to a pending delivery
    //use Redis Geo to find nearest driver
    @Transactional
    public  void  attemptDriverAssignment(Delivery delivery){
        if ( delivery.getStatus()!= DeliveryStatus.PENDING){
            log.debug("Delivery {} is not PENDING, skipping assignment", delivery.getDeliveryId());
            return;
        }
        //use res location for matching (if available )
        double restaurantLat = delivery.getPickupLatitude() != null
                ? delivery.getPickupLatitude()
                .doubleValue() : 23.2599;
        double restaurantLng = delivery.getPickupLongitude() != null
                ? delivery.getPickupLongitude().doubleValue() : 77.4126;
        Optional<Driver> nearestDriver  = driverMatchingService.findNearestDriver(restaurantLat,restaurantLng);
        if (nearestDriver.isEmpty()){
            log.warn("No available driver for delivery {}, will retry", delivery.getDeliveryId());
            return;
        }
        Driver driver = nearestDriver.get();
        
        // Only assign if driver has no active delivery
        if (driver.getStatus() == DriverStatus.ONLINE && 
            deliveryRepo.findActiveDeliveryByDriverId(driver.getDriverId()).isEmpty()) {
            assignDriver(delivery, driver, restaurantLat, restaurantLng);
        } else {
            log.warn("Driver {} cannot be assigned (status={}, hasActiveDelivery={})", 
                driver.getDriverId(), driver.getStatus(), 
                deliveryRepo.findActiveDeliveryByDriverId(driver.getDriverId()).isPresent());
        }
    }

    // Assign a specific driver to a delivery
    @Transactional
    public  void  assignDriver(Delivery delivery , Driver driver , double resLat , double resLng ){
        driver.setStatus(DriverStatus.ASSIGNED);
        driverRepo.save(driver);

        double driverLat = driver.getCurrentLatitude()!=null ? driver.getCurrentLatitude().doubleValue():resLat;
        double driverLng =driver.getCurrentLongitude()!=null?driver.getCurrentLongitude().doubleValue():resLng;
        double customerLat = delivery.getDropoffLatitude() != null ? delivery.getDropoffLatitude().doubleValue() : resLat;
        double customerLng = delivery.getDropoffLongitude() != null ? delivery.getDropoffLongitude().doubleValue() : resLng;


        int estimateMins = etaService.calculateETA(driverLat,driverLng,resLat,resLng,customerLat,customerLng);
        double distance = etaService.calculateDistanceKm(resLat,resLng,customerLat,customerLng);
        //update Delivery
        delivery.setDriverId(driver.getDriverId());
        delivery.setStatus(DeliveryStatus.DRIVER_ASSIGNED);
        delivery.setEstimatedDeliveryMins(estimateMins);
        delivery.setDistanceKm(etaService.totalDisBigDecimal(distance));
        delivery.setAssignedAt(LocalDateTime.now());
        deliveryRepo.save(delivery);

        log.info("Driver assigned: driverId={}, orderId={}, ETA={}mins",
                driver.getDriverId(), delivery.getOrderId(), estimateMins);

        //produce to kafka event

        eventProducer.sendDriverAssigned(DriverAssignedEvent.builder()
                .deliveryId(delivery.getDeliveryId())
                .orderId(delivery.getOrderId())
                .driverId(driver.getDriverId())
                .driverName(driver.getName())
                .driverPhone(driver.getPhone())
                .vehicleType(driver.getVehicleType())
                .vehicleNumber(driver.getVehicleNumber())
                .estimatedMins(estimateMins)
                .assignedAt(delivery.getAssignedAt())
                .build());
    }

    // Driver confirms pickup from restaurant
    @Transactional
    public DeliveryResponse confirmPickup(String driverId) {
        Delivery delivery = deliveryRepo.findActiveDeliveryByDriverId(driverId)
                .orElseThrow(() -> new IllegalStateException("No active delivery found for this driver"));
        if (delivery.getStatus() != DeliveryStatus.DRIVER_ASSIGNED) {
            throw new IllegalStateException("Cannot confirm pickup — current status: " + delivery.getStatus());
        }
        delivery.setStatus(DeliveryStatus.PICKED_UP);
        delivery.setPickedUpAt(LocalDateTime.now());
        deliveryRepo.save(delivery);
        // Update driver status
        Driver driver = driverRepo.findById(driverId)
                .orElseThrow(() -> new IllegalStateException("Driver not found"));
        driver.setStatus(DriverStatus.PICKED_UP);
        driverRepo.save(driver);
        log.info("Pickup confirmed: orderId={}, driverId={}", delivery.getOrderId(), driverId);
        // Publish Kafka even
        eventProducer.sendDeliveryPickedUp(DeliveryPickedUpEvent.builder()
                .deliveryId(delivery.getDeliveryId())
                .orderId(delivery.getOrderId())
                .driverId(driverId)
                .estimatedMins(delivery.getEstimatedDeliveryMins())
                .pickedUpAt(delivery.getPickedUpAt())
                .build());

        return toDeliveryResponse(delivery);
    }

    //Driver complete the delivery
    @Transactional
    public DeliveryResponse completeDelivery(String driverId ){
        Delivery delivery = deliveryRepo.findActiveDeliveryByDriverId(driverId)
                .orElseThrow(()-> new IllegalStateException("No active delivery found for this order"));
        if (delivery.getStatus()!=DeliveryStatus.PICKED_UP && delivery.getStatus()!=DeliveryStatus.IN_TRANSIT){
            throw  new IllegalStateException("cannot complete delivery - current status:" + delivery.getStatus());
        }
        LocalDateTime now =LocalDateTime.now();
        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveredAt(now);

        // calculate actual delivery time
        if (delivery.getAssignedAt() != null ){
            int actualTime = (int) ChronoUnit.MINUTES.between(delivery.getAssignedAt(),now);
            delivery.setActualDeliveryMins(actualTime);
        }
        deliveryRepo.save(delivery);
        // Update driver: back to ONLINE, increment total deliveries
        Driver driver = driverRepo.findById(driverId)
                .orElseThrow(() -> new IllegalStateException("Driver not found"));
        driver.setStatus(DriverStatus.ONLINE);
        driver.setTotalDeliveries(driver.getTotalDeliveries() + 1);
        driverRepo.save(driver);
        log.info("Delivery completed: orderId={}, driverId={}, actualMins={}",
                delivery.getOrderId(), driverId, delivery.getActualDeliveryMins());

        //publish kafka event -trigger payment settlement
        eventProducer.sendDeliveryCompleted(DeliveryCompletedEvent.builder()
                .deliveryId(delivery.getDeliveryId())
                .orderId(delivery.getOrderId())
                .userId(delivery.getUserId())
                .restaurantId(delivery.getRestaurantId())
                .driverId(driverId)
                .distanceKm(delivery.getDistanceKm())
                .actualDeliveryMins(delivery.getActualDeliveryMins())
                .deliveredAt(now)
                .userEmail(delivery.getUserEmail())
                .userName(delivery.getUserName())
                .build());
        return toDeliveryResponse(delivery);

    }
    // cancel a delivery
    @Transactional
    public DeliveryResponse cancelDelivery(String orderId , String reason ){
        Delivery delivery = deliveryRepo.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalStateException("Delivery not found for order: " + orderId));
        if (delivery.getStatus()== DeliveryStatus.DELIVERED || delivery.getStatus()==DeliveryStatus.CANCELLED){
            throw new IllegalStateException("Cannot cancel delivery — current status: " + delivery.getStatus());
        }
        delivery.setStatus(DeliveryStatus.CANCELLED);
        delivery.setCancelReason(reason);
        deliveryRepo.save(delivery);
        //release if already assigned
        if (delivery.getDriverId()!=null){
            Optional<Driver> driverOpt = driverRepo.findById(delivery.getDriverId());
            driverOpt.ifPresent(driver -> {
                driver.setStatus(DriverStatus.ONLINE);
                driverRepo.save(driver);
                log.info("Driver {} released back to ONLINE after cancellation", driver.getDriverId());
            });
        }
        log.info("Delivery cancelled: orderId={}, reason={}", orderId, reason);
        return toDeliveryResponse(delivery);

    }

    /// ////////----------------------QUERIES----------------------------//////////
    //get delivery by orderId
    public  DeliveryResponse getDeliveryByOrderId(String orderId ){
        Delivery delivery = deliveryRepo.findByOrderId(orderId)
                .orElseThrow(()->new IllegalStateException("Delivery not found for order:" + orderId));
        return toDeliveryResponse(delivery);
    }
    // get all deliveries  for user by userId
    public List<DeliveryResponse> getAllDeliveriesByUserId(String userId ){
        return deliveryRepo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDeliveryResponse)
                .toList();
    }
    //get Active deliveries for a user
    public  List<DeliveryResponse> getActiveDeliveryByUserId (String userId ){
        return deliveryRepo.findActiveDeliveriesByUserId(userId)
                .stream()
                .map(this::toDeliveryResponse)
                .toList();

    }
    //get active delivery for a driver (returns null if none)
    public  DeliveryResponse getActiveDeliveryForDriver(String driverId ){
        return deliveryRepo.findActiveDeliveryByDriverId(driverId)
                .map(this::toDeliveryResponse)
                .orElse(null);
    }

    // get all delivery history for a driver
    public List<DeliveryResponse> getDeliveryHistoryForDriver(String driverId) {
        return deliveryRepo.findByDriverIdOrderByCreatedAtDesc(driverId)
                .stream()
                .map(this::toDeliveryResponse)
                .toList();
    }

    //Retry matching for all pending delivery (Called By Scheduler)

    @Transactional
    public void retryPendingDeliveries(){
        List<Delivery> pending = deliveryRepo.findPendingDeliveries();
        for (Delivery delivery : pending){
            // Check expiry: cancel if pending for > 30 mins
            if (delivery.getCreatedAt().isBefore(LocalDateTime.now().minus(30, ChronoUnit.MINUTES))) {
                delivery.setStatus(DeliveryStatus.CANCELLED);
                delivery.setCancelReason("No driver available - expired");
                deliveryRepo.save(delivery);
                continue;
            }

            // Check max retries
            int currentRetries = delivery.getRetryCount() != null ? delivery.getRetryCount() : 0;
            if (currentRetries >= 10) { // Max retries
                delivery.setStatus(DeliveryStatus.CANCELLED);
                delivery.setCancelReason("No driver available - max retries reached");
                deliveryRepo.save(delivery);
                continue;
            }

            // Increment retries
            delivery.setRetryCount(currentRetries + 1);
            deliveryRepo.save(delivery);

            log.info("Retrying driver assignment for delivery {}", delivery.getDeliveryId());
            attemptDriverAssignment(delivery);

        }
    }

    //--------Mappers ---------------//

    private DriverResponse toDriverResponse(Driver driver){
        return DriverResponse.builder()
                .driverId(driver.getDriverId())
                .userId(driver.getUserId())
                .name(driver.getName())
                .phone(driver.getPhone())
                .vehicleType(driver.getVehicleType())
                .vehicleNumber(driver.getVehicleNumber())
                .status(driver.getStatus().name())
                .currentLatitude(driver.getCurrentLatitude())
                .currentLongitude(driver.getCurrentLongitude())
                .avgRating(driver.getAvgRating())
                .totalDeliveries(driver.getTotalDeliveries())
                .build();
    }

    private DeliveryResponse toDeliveryResponse(Delivery delivery) {
        // Compute a simple delivery fee: base ₹30 + ₹10 per km
        BigDecimal fee = new BigDecimal("30.00");
        if (delivery.getDistanceKm() != null) {
            fee = fee.add(delivery.getDistanceKm().multiply(new BigDecimal("10")));
        }

        DeliveryResponse.DeliveryResponseBuilder builder = DeliveryResponse.builder()
                .deliveryId(delivery.getDeliveryId())
                .orderId(delivery.getOrderId())
                .userId(delivery.getUserId())
                .restaurantId(delivery.getRestaurantId())
                .restaurantName(delivery.getRestaurantName())
                .driverId(delivery.getDriverId())
                .status(delivery.getStatus().name())
                .pickupAddress(delivery.getPickupAddress())
                .dropoffAddress(delivery.getDropoffAddress())
                .deliveryAddress(delivery.getDropoffAddress())  // alias for frontend
                .estimatedDeliveryMins(delivery.getEstimatedDeliveryMins())
                .actualDeliveryMins(delivery.getActualDeliveryMins())
                .distanceKm(delivery.getDistanceKm())
                .deliveryFee(fee)
                .assignedAt(delivery.getAssignedAt())
                .pickedUpAt(delivery.getPickedUpAt())
                .deliveredAt(delivery.getDeliveredAt())
                .createdAt(delivery.getCreatedAt());

        // Add driver info if assigned
        if (delivery.getDriverId() != null) {
            driverRepo.findById(delivery.getDriverId()).ifPresent(driver -> {
                builder.driverName(driver.getName());
                builder.driverPhone(driver.getPhone());
                builder.driverLatitude(driver.getCurrentLatitude());
                builder.driverLongitude(driver.getCurrentLongitude());
            });
        }

        return builder.build();
    }

}
