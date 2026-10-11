package com.foodDelivery.delivery_service.domain;

public enum DeliveryStatus {
    PENDING,           // Order placed, waiting for driver assignment
    DRIVER_ASSIGNED,   // Driver matched and assigned
    PICKED_UP,         // Driver picked up from restaurant
    IN_TRANSIT,        // Driver en route to customer
    DELIVERED,         // Successfully delivered
    CANCELLED,         // Delivery cancelled
    FAILED             // Delivery failed (no driver found, etc.)


}
