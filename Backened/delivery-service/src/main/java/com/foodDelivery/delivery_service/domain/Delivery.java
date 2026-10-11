package com.foodDelivery.delivery_service.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Delivery {

    @Id
    @Column(name = "delivery_id" , length = 36)
    private String deliveryId;

    @Column(name = "order_id", nullable = false,unique = true,length = 36)
    private String orderId  ;

    @Column(name = "user_id" , nullable = false , length = 36)
    private String userId ;

    @Column(name = "restaurant_Id" , nullable = false, length = 36)
    private String restaurantId;

    @Column(name = "restaurant_name" , length = 200)
    private String restaurantName ;
    
    @Column(name = "user_email")
    private String userEmail;
    
    @Column(name = "user_name")
    private String userName;

    @Column(name = "driver_id", length = 36)
    private String driverId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status;

    // Restaurant location (pickup point)
    @Column(name = "pickup_latitude", precision = 10, scale = 8)
    private BigDecimal pickupLatitude;

    @Column(name = "pickup_longitude", precision = 11, scale = 8)
    private BigDecimal pickupLongitude;

    @Column(name = "pickup_address", length = 500)
    private String pickupAddress;

    // Customer location (drop-off point)
    @Column(name = "dropoff_latitude", precision = 10, scale = 8)
    private BigDecimal dropoffLatitude;

    @Column(name = "dropoff_longitude", precision = 11, scale = 8)
    private BigDecimal dropoffLongitude;

    @Column(name = "dropoff_address", length = 500)
    private String dropoffAddress;

    @Column(name = "estimated_delivery_mins")
    private Integer estimatedDeliveryMins;

    @Column(name = "actual_delivery_mins")
    private Integer actualDeliveryMins;

    @Column(name = "distance_km", precision = 6, scale = 2)
    private BigDecimal distanceKm;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "picked_up_at")
    private LocalDateTime pickedUpAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

}
