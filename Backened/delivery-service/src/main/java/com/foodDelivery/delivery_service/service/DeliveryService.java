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
        boolean hasActiveDelivery = deliveryRepo.findActiveDeliveryByDriverId(driver.getDriverId()).isPresent();
        if (hasActiveDelivery) {
            throw new IllegalStateException("Cannot go offline while on an active delivery");
        }
        driver.setStatus(DriverStatus.OFFLINE);
        driverRepo.save(driver);

        //Remove from Redis Geo
        driverMatchingService.removeDriverLocation(driver.getDriverId());
        log.info("Driver offline: driverId={}", driver.getDriverId());
        return  toDriverResponse(driver);

    }

    //Get driver profile by userId
    @Transactional
    public DriverResponse getDriverProfile(String userId ){
        Driver driver = driverRepo.findByUserId(userId)
                .orElseThrow(()->new IllegalStateException("Driver profile not found"));
        // Auto-heal driver status if DB says ASSIGNED or PICKED_UP but no active delivery exists
        if ((driver.getStatus() == DriverStatus.ASSIGNED || driver.getStatus() == DriverStatus.PICKED_UP)
                && deliveryRepo.findActiveDeliveryByDriverId(driver.getDriverId()).isEmpty()) {
            driver.setStatus(DriverStatus.ONLINE);
            driverRepo.save(driver);
            if (driver.getCurrentLatitude() != null && driver.getCurrentLongitude() != null) {
                driverMatchingService.updateDriverLocation(
                        driver.getDriverId(),
                        driver.getCurrentLatitude().doubleValue(),
                        driver.getCurrentLongitude().doubleValue()
                );
            }
        }
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

        java.util.Map restDetails = fetchRestaurantDetails(event.getRestaurantId());
        String restAddress = "shavat city,balapir,adalaj";
        String restPhone = "9408534410";
        if (restDetails != null) {
            if (restDetails.get("address") != null && !restDetails.get("address").toString().isBlank()) {
                restAddress = restDetails.get("address").toString();
            }
            if (restDetails.get("phone") != null && !restDetails.get("phone").toString().isBlank()) {
                restPhone = restDetails.get("phone").toString();
            }
        }

        BigDecimal pickupLat = event.getPickupLatitude();
        BigDecimal pickupLng = event.getPickupLongitude();
        if (pickupLat == null || pickupLng == null || pickupLat.doubleValue() == 0) {
            if (restDetails != null && restDetails.get("latitude") != null && restDetails.get("longitude") != null) {
                pickupLat = new BigDecimal(restDetails.get("latitude").toString());
                pickupLng = new BigDecimal(restDetails.get("longitude").toString());
            } else {
                pickupLat = BigDecimal.valueOf(23.1644); // Balapir / Adalaj default
                pickupLng = BigDecimal.valueOf(72.5855);
            }
        }

        BigDecimal dropoffLat = event.getDropoffLatitude();
        BigDecimal dropoffLng = event.getDropoffLongitude();
        if (dropoffLat == null || dropoffLng == null || dropoffLat.doubleValue() == 0) {
            if (event.getDeliveryAddress() != null) {
                String addrLower = event.getDeliveryAddress().toLowerCase();
                if (addrLower.contains("nirma") || addrLower.contains("tragad") || addrLower.contains("sg highway")) {
                    dropoffLat = BigDecimal.valueOf(23.12639030);
                    dropoffLng = BigDecimal.valueOf(72.54000890);
                } else {
                    dropoffLat = BigDecimal.valueOf(23.1288);
                    dropoffLng = BigDecimal.valueOf(72.5448);
                }
            } else {
                dropoffLat = BigDecimal.valueOf(23.1288);
                dropoffLng = BigDecimal.valueOf(72.5448);
            }
        }

        Delivery delivery = Delivery.builder()
                .deliveryId(UUID.randomUUID().toString())
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .restaurantId(event.getRestaurantId())
                .restaurantName(event.getRestaurantName())
                .status(DeliveryStatus.PENDING)
                .dropoffAddress(event.getDeliveryAddress())
                .pickupAddress(restAddress)
                .restaurantPhone(restPhone)
                .pickupLatitude(pickupLat)
                .pickupLongitude(pickupLng)
                .dropoffLatitude(dropoffLat)
                .dropoffLongitude(dropoffLng)
                .specialInstructions(event.getSpecialInstructions())
                .userEmail(event.getUserEmail())
                .userName(event.getUserName())
                .userPhone(event.getUserPhone())
                .build();
        delivery=deliveryRepo.save(delivery);
        log.info("Delivery created: deliveryId={}, orderId={}, rest=[{}, {}], pickup=[{}, {}], dropoff=[{}, {}]",
                delivery.getDeliveryId(), event.getOrderId(), restAddress, restPhone, pickupLat, pickupLng, dropoffLat, dropoffLng);

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
                ? delivery.getPickupLatitude().doubleValue() : 23.1644;
        double restaurantLng = delivery.getPickupLongitude() != null
                ? delivery.getPickupLongitude().doubleValue() : 72.5855;
        Optional<Driver> nearestDriver  = driverMatchingService.findNearestDriver(restaurantLat,restaurantLng);
        if (nearestDriver.isEmpty()){
            log.warn("No available driver for delivery {}, will retry", delivery.getDeliveryId());
            return;
        }
        Driver driver = nearestDriver.get();
        // Only assign if driver has no active delivery and is not OFFLINE
        if (driver.getStatus() != DriverStatus.OFFLINE && 
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

    // Driver declines / rejects the assigned delivery request
    @Transactional
    public DeliveryResponse declineDelivery(String driverId) {
        Delivery delivery = deliveryRepo.findActiveDeliveryByDriverId(driverId)
                .orElseThrow(() -> new IllegalStateException("No active assigned delivery found for this driver"));

        if (delivery.getStatus() != DeliveryStatus.DRIVER_ASSIGNED) {
            throw new IllegalStateException("Cannot decline delivery with status: " + delivery.getStatus());
        }

        // Release driver back to ONLINE
        Driver driver = driverRepo.findById(driverId)
                .orElseThrow(() -> new IllegalStateException("Driver not found"));
        driver.setStatus(DriverStatus.ONLINE);
        driverRepo.save(driver);

        if (driver.getCurrentLatitude() != null && driver.getCurrentLongitude() != null) {
            driverMatchingService.updateDriverLocation(
                    driver.getDriverId(),
                    driver.getCurrentLatitude().doubleValue(),
                    driver.getCurrentLongitude().doubleValue()
            );
        }

        // Reset delivery back to PENDING so another driver can be assigned
        delivery.setDriverId(null);
        delivery.setStatus(DeliveryStatus.PENDING);
        delivery.setAssignedAt(null);
        Delivery savedDelivery = deliveryRepo.save(delivery);

        log.info("Driver {} declined delivery {}. Reset to PENDING for rematching.", driverId, delivery.getDeliveryId());

        return toDeliveryResponse(savedDelivery);
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
    @Transactional
    public  DeliveryResponse getActiveDeliveryForDriver(String driverId ){
        Optional<Delivery> active = deliveryRepo.findActiveDeliveryByDriverId(driverId);
        if (active.isEmpty()) {
            // Auto-heal driver status in DB if left as ASSIGNED or PICKED_UP
            driverRepo.findById(driverId).ifPresent(d -> {
                if (d.getStatus() == DriverStatus.ASSIGNED || d.getStatus() == DriverStatus.PICKED_UP) {
                    d.setStatus(DriverStatus.ONLINE);
                    driverRepo.save(d);
                    if (d.getCurrentLatitude() != null && d.getCurrentLongitude() != null) {
                        driverMatchingService.updateDriverLocation(
                                d.getDriverId(),
                                d.getCurrentLatitude().doubleValue(),
                                d.getCurrentLongitude().doubleValue()
                        );
                    }
                }
            });
            return null;
        }
        return toDeliveryResponse(active.get());
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
            // Check max retries (each retry is ~30s, 20 retries = 10 minutes)
            int currentRetries = delivery.getRetryCount() != null ? delivery.getRetryCount() : 0;
            if (currentRetries >= 20) {
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
        // Compute delivery fee: base ₹30 + ₹10 per km (₹0 if cancelled)
        BigDecimal fee = BigDecimal.ZERO;
        if (delivery.getStatus() != null && delivery.getStatus() != DeliveryStatus.CANCELLED && delivery.getStatus() != DeliveryStatus.FAILED) {
            fee = new BigDecimal("30.00");
            if (delivery.getDistanceKm() != null) {
                fee = fee.add(delivery.getDistanceKm().multiply(new BigDecimal("10")));
            }
        }

        String pickupAddr = delivery.getPickupAddress();
        String restPhone = delivery.getRestaurantPhone();
        if (pickupAddr == null || pickupAddr.isBlank() || restPhone == null) {
            java.util.Map restDetails = fetchRestaurantDetails(delivery.getRestaurantId());
            if (restDetails != null) {
                if (pickupAddr == null || pickupAddr.isBlank()) {
                    pickupAddr = restDetails.get("address") != null ? restDetails.get("address").toString() : "shavat city,balapir,adalaj";
                }
                if (restPhone == null) {
                    restPhone = restDetails.get("phone") != null ? restDetails.get("phone").toString() : "9408534410";
                }
            } else {
                if (pickupAddr == null || pickupAddr.isBlank()) pickupAddr = "shavat city,balapir,adalaj";
                if (restPhone == null) restPhone = "9408534410";
            }
        }

        DeliveryResponse.DeliveryResponseBuilder builder = DeliveryResponse.builder()
                .deliveryId(delivery.getDeliveryId())
                .orderId(delivery.getOrderId())
                .userId(delivery.getUserId())
                .restaurantId(delivery.getRestaurantId())
                .restaurantName(delivery.getRestaurantName())
                .driverId(delivery.getDriverId())
                .status(delivery.getStatus().name())
                .pickupAddress(pickupAddr)
                .restaurantAddress(pickupAddr)
                .restaurantPhone(restPhone)
                .dropoffAddress(delivery.getDropoffAddress())
                .deliveryAddress(delivery.getDropoffAddress())  // alias for frontend
                .pickupLatitude(delivery.getPickupLatitude() != null ? delivery.getPickupLatitude() : BigDecimal.valueOf(23.1644))
                .pickupLongitude(delivery.getPickupLongitude() != null ? delivery.getPickupLongitude() : BigDecimal.valueOf(72.5855))
                .dropoffLatitude(delivery.getDropoffLatitude() != null ? delivery.getDropoffLatitude() : BigDecimal.valueOf(23.1264))
                .dropoffLongitude(delivery.getDropoffLongitude() != null ? delivery.getDropoffLongitude() : BigDecimal.valueOf(72.5400))
                .estimatedDeliveryMins(delivery.getEstimatedDeliveryMins())
                .actualDeliveryMins(delivery.getActualDeliveryMins())
                .distanceKm(delivery.getDistanceKm())
                .deliveryFee(fee)
                .assignedAt(delivery.getAssignedAt())
                .pickedUpAt(delivery.getPickedUpAt())
                .deliveredAt(delivery.getDeliveredAt())
                .createdAt(delivery.getCreatedAt())
                .userName(delivery.getUserName())
                .userPhone(delivery.getUserPhone())
                .userEmail(delivery.getUserEmail())
                .specialInstructions(delivery.getSpecialInstructions());

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

    public java.util.Map fetchRestaurantDetails(String restaurantId) {
        if (restaurantId == null || restaurantId.isBlank()) return null;
        try {
            org.springframework.web.client.RestClient rc = org.springframework.web.client.RestClient.create();
            return rc.get()
                    .uri("http://localhost:8082/restaurants/{id}", restaurantId)
                    .retrieve()
                    .body(java.util.Map.class);
        } catch (Exception e) {
            log.warn("Could not fetch restaurant details for {}: {}", restaurantId, e.getMessage());
        }
        return null;
    }

    @Transactional
    public void rateDriver(String deliveryIdOrOrderId, int rating, String comment) {
        Optional<Delivery> deliveryOpt = deliveryRepo.findById(deliveryIdOrOrderId);
        if (deliveryOpt.isEmpty()) {
            deliveryOpt = deliveryRepo.findByOrderId(deliveryIdOrOrderId);
        }
        deliveryOpt.ifPresent(delivery -> {
            if (delivery.getDriverId() != null) {
                driverRepo.findById(delivery.getDriverId()).ifPresent(driver -> {
                    BigDecimal currentRating = driver.getAvgRating() != null && driver.getAvgRating().compareTo(BigDecimal.ZERO) > 0
                            ? driver.getAvgRating()
                            : BigDecimal.valueOf(5.0);
                    BigDecimal newRating = currentRating.add(BigDecimal.valueOf(rating))
                            .divide(BigDecimal.valueOf(2), 1, java.math.RoundingMode.HALF_UP);
                    driver.setAvgRating(newRating);
                    driverRepo.save(driver);
                    log.info("Updated driver {} rating to {} based on customer review", driver.getDriverId(), newRating);
                });
            }
        });
    }

}
