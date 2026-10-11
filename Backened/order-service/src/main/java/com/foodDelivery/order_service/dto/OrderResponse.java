package com.foodDelivery.order_service.dto;

import com.foodDelivery.order_service.domain.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private String orderId;
    private String userId;
    private String restaurantId;
    private String restaurantName;
    private String driverId;
    private String deliveryAddressId;
    private String deliveryAddress;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal deliveryFee;
    private BigDecimal surgeMultiplier;
    private BigDecimal totalAmount;
    private String specialInstructions;
    private Integer estimatedDeliveryMins;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime deliveredAt;
    private String cancellationReason;

    public static OrderResponse fromEntity(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(OrderItemResponse::fromEntity)
                .toList();

        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .userId(order.getUserId())
                .restaurantId(order.getRestaurantId())
                .restaurantName(order.getRestaurantName())
                .driverId(order.getDriverId())
                .deliveryAddressId(order.getDeliveryAddressId())
                .deliveryAddress(order.getDeliverAddress())
                .status(order.getStatus().name())
                .subtotal(order.getSubTotal())
                .deliveryFee(order.getDeliveryFee())
                .surgeMultiplier(order.getSurgeMultiplier())
                .totalAmount(order.getTotalAmount())
                .specialInstructions(order.getSpecialInstructions())
                .estimatedDeliveryMins(order.getEstimatedDeliveryMins())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .confirmedAt(order.getConfirmedAt())
                .deliveredAt(order.getDeliveredAt())
                .cancellationReason(order.getCancellationReason())
                .build();
    }
}
