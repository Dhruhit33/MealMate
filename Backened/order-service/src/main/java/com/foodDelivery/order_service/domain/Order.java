package com.foodDelivery.order_service.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name ="orders" , indexes = {
        @Index(name ="idx_users", columnList = "userId"),
        @Index(name ="idx_status",columnList = "status"),
        @Index(name="idx_restaurant",columnList = "restaurantId")
})
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String orderId;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String restaurantId;

    private String driverId;

    @Column(nullable = false)
    private String deliveryAddressId;


    private String deliverAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.CREATED;

    @Column(nullable = false , precision = 10,scale = 2)
    private BigDecimal subTotal;
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal deliveryFee = new BigDecimal("30.00");

    @Column(precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal surgeMultiplier = new BigDecimal("1.00");

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(columnDefinition = "TEXT")
    private String specialInstructions;

    private Integer estimatedDeliveryMins;

    // For group orders
    private String groupOrderId;

    // Store restaurant name (denormalized)
    private String restaurantName;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();


    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime confirmedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime cancelledAt;

    private String cancellationReason;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }




    //orderState machine
    public enum OrderStatus{
        CREATED,
        CONFIRMED,
        PREPARING,
        READY,
        PICKED_UP,
        DELIVERED,
        COMPLETED,
        CANCELLED
    }

    public boolean canTransitionTo(OrderStatus newStatus) {
        return switch (this.status) {
            case CREATED    -> newStatus == OrderStatus.CONFIRMED || newStatus == OrderStatus.CANCELLED;
            case CONFIRMED  -> newStatus == OrderStatus.PREPARING || newStatus == OrderStatus.CANCELLED;
            case PREPARING  -> newStatus == OrderStatus.READY;
            case READY      -> newStatus == OrderStatus.PICKED_UP;
            case PICKED_UP  -> newStatus == OrderStatus.DELIVERED;
            case DELIVERED   -> newStatus == OrderStatus.COMPLETED;
            case COMPLETED, CANCELLED -> false; // Terminal states
        };
    }

    public  void transitionTo(OrderStatus newStatus){
        if(!canTransitionTo(newStatus)){
            throw new IllegalStateException(
                    "Cannot transition from " + this.status + " to " + newStatus
            );
        }
        this.status=newStatus;

        //setTimeStamp based on state

        switch (newStatus){
            case CONFIRMED -> this.confirmedAt =LocalDateTime.now();
            case DELIVERED -> this.deliveredAt=LocalDateTime.now();
            case CANCELLED -> this.cancelledAt=LocalDateTime.now();
            default -> {}
        }
    }
}
