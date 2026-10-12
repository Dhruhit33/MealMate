package com.foodDelivery.order_service.service;

import com.foodDelivery.order_service.domain.Order;
import com.foodDelivery.order_service.domain.OrderItem;
import com.foodDelivery.order_service.dto.*;
import com.foodDelivery.order_service.kafka.OrderEventProducer;
import com.foodDelivery.order_service.repository.OrderRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepo orderRepository;
    private final CartService cartService;
    private final OrderEventProducer orderEventProducer;

    // ─── Place Order (from Cart) ───────────────────────────────────────

    @Transactional
    public OrderResponse placeOrder(String userId, String userEmail, PlaceOrderRequest request) {
        // 1. Get current cart
        CartResponse cart = cartService.getCart(userId);

        if (cart.getItem() == null || cart.getItem().isEmpty()) {
            throw new RuntimeException("Cart is empty. Add items before placing an order.");
        }

        // 2. Create Order entity
        Order order = Order.builder()
                .userId(userId)
                .restaurantId(cart.getRestaurantId())
                .restaurantName(cart.getRestaurantName())
                .deliveryAddressId(request.getDeliveryAddressId())
                .deliverAddress(request.getDeliverAddress())
                .subTotal(cart.getSubTotal())
                .deliveryFee(cart.getDeliveryFee())
                .totalAmount(cart.getTotal())
                .specialInstructions(request.getSpecialInstructions())
                .estimatedDeliveryMins(30) // Default ETA
                .build();

        // 3. Convert cart items to order items
        List<OrderItem> orderItems = cart.getItem().stream()
                .map(cartItem -> OrderItem.builder()
                        .order(order)
                        .menuItemId(cartItem.getMenuItemId())
                        .menuItemName(cartItem.getMenuItemName())
                        .quantity(cartItem.getQuantity())
                        .unitPrice(cartItem.getUnitPrice())
                        .totalPrice(cartItem.getTotalPrice())
                        .addedByUserId(userId)
                        .build())
                .toList();

        order.setItems(orderItems);

        // 4. Save to MySQL
        Order savedOrder = orderRepository.save(order);
        log.info("Order placed: orderId={}, userId={}, restaurant={}, total={}",
                savedOrder.getOrderId(), userId, cart.getRestaurantName(), cart.getTotal());

        // 5. Publish order-placed event to Kafka
        try {
            BigDecimal pickupLat = null;
            BigDecimal pickupLng = null;
            BigDecimal[] restCoords = fetchRestaurantCoordinates(cart.getRestaurantId());
            if (restCoords != null) {
                pickupLat = restCoords[0];
                pickupLng = restCoords[1];
            }

            BigDecimal dropoffLat = request.getLatitude();
            BigDecimal dropoffLng = request.getLongitude();
            if ((dropoffLat == null || dropoffLat.doubleValue() == 0) && request.getDeliverAddress() != null) {
                String addrLower = request.getDeliverAddress().toLowerCase();
                if (addrLower.contains("nirma") || addrLower.contains("tragad") || addrLower.contains("sg highway")) {
                    dropoffLat = BigDecimal.valueOf(23.12639030);
                    dropoffLng = BigDecimal.valueOf(72.54000890);
                }
            }

            orderEventProducer.sendOrderPlaced(OrderPlacedEvent.builder()
                    .orderId(savedOrder.getOrderId())
                    .userId(userId)
                    .userEmail(userEmail)
                    .userName(request.getCustomerName() != null && !request.getCustomerName().isBlank() ? request.getCustomerName() : "Customer")
                    .userPhone(request.getCustomerPhone())
                    .restaurantId(cart.getRestaurantId())
                    .restaurantName(cart.getRestaurantName())
                    .totalAmount(cart.getTotal())
                    .deliveryAddress(request.getDeliverAddress())
                    .pickupLatitude(pickupLat)
                    .pickupLongitude(pickupLng)
                    .dropoffLatitude(dropoffLat)
                    .dropoffLongitude(dropoffLng)
                    .specialInstructions(request.getSpecialInstructions())
                    .placedAt(savedOrder.getCreatedAt())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to publish order-placed event (Kafka may not be running): {}", e.getMessage());
        }

        // 6. Clear the cart
        cartService.clearCart(userId);

        return OrderResponse.fromEntity(savedOrder);
    }

    // ─── Get Order by ID ───────────────────────────────────────────────

    public OrderResponse getOrder(String orderId) {
        Order order = getOrderEntity(orderId);
        return OrderResponse.fromEntity(order);
    }

    // ─── Get My Orders (user history) ──────────────────────────────────

    public List<OrderResponse> getMyOrders(String userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    // ─── Get Orders for Restaurant (owner dashboard) ───────────────────

    public List<OrderResponse> getRestaurantOrders(String restaurantId) {
        return orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId).stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    // ─── Get Active Orders for Restaurant ──────────────────────────────

    public List<OrderResponse> getActiveRestaurantOrders(String restaurantId) {
        List<Order.OrderStatus> activeStatuses = List.of(
                Order.OrderStatus.CREATED,
                Order.OrderStatus.CONFIRMED,
                Order.OrderStatus.PREPARING,
                Order.OrderStatus.READY
        );
        return orderRepository.findActiveOrdersForRestaurant(restaurantId, activeStatuses).stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    // ─── Update Order Status (state machine) ───────────────────────────

    @Transactional
    public OrderResponse updateStatus(String orderId, UpdateStatusRequest request) {
        Order order = getOrderEntity(orderId);

        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(request.getStatus().toUpperCase());

        // Use state machine to validate transition
        order.transitionTo(newStatus);

        // Update optional fields
        if (request.getDriverId() != null) {
            order.setDriverId(request.getDriverId());
        }
        if (request.getEstimatedMins() != null) {
            order.setEstimatedDeliveryMins(request.getEstimatedMins());
        }

        if (newStatus == Order.OrderStatus.CANCELLED) {
            String cancelReason = request.getReason() != null && !request.getReason().isBlank()
                    ? request.getReason()
                    : "Cancelled by restaurant - item unavailable";
            order.setCancellationReason(cancelReason);
            try {
                orderEventProducer.sendOrderCancelled(OrderCancelledEvent.builder()
                        .orderId(orderId)
                        .userId(order.getUserId())
                        .restaurantId(order.getRestaurantId())
                        .reason(cancelReason)
                        .cancelledAt(order.getCancelledAt())
                        .build());
            } catch (Exception e) {
                log.warn("Failed to publish order-cancelled event: {}", e.getMessage());
            }
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Order {} status changed to {}", orderId, newStatus);

        return OrderResponse.fromEntity(savedOrder);
    }

    // ─── Cancel Order ──────────────────────────────────────────────────

    @Transactional
    public OrderResponse cancelOrder(String orderId, String userId, String reason) {
        Order order = getOrderEntity(orderId);

        // Only the user who placed the order can cancel
        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("You can only cancel your own orders");
        }

        // State machine validates if cancellation is allowed
        order.transitionTo(Order.OrderStatus.CANCELLED);
        order.setCancellationReason(reason != null ? reason : "Cancelled by user");

        Order savedOrder = orderRepository.save(order);
        log.info("Order {} cancelled by user {}. Reason: {}", orderId, userId, reason);

        // Publish cancellation event to Kafka
        try {
            orderEventProducer.sendOrderCancelled(OrderCancelledEvent.builder()
                    .orderId(orderId)
                    .userId(userId)
                    .restaurantId(order.getRestaurantId())
                    .reason(order.getCancellationReason())
                    .cancelledAt(order.getCancelledAt())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to publish order-cancelled event: {}", e.getMessage());
        }

        return OrderResponse.fromEntity(savedOrder);
    }

    // ─── Handle Order Accepted (from Restaurant via Kafka) ─────────────

    @Transactional
    public void handleOrderAccepted(OrderAcceptedEvent event) {
        try {
            Order order = getOrderEntity(event.getOrderId());

            if (order.getStatus() == Order.OrderStatus.CREATED) {
                order.transitionTo(Order.OrderStatus.CONFIRMED);
                if (event.getEstimatedPrepTimeMins() != null) {
                    order.setEstimatedDeliveryMins(event.getEstimatedPrepTimeMins() + 15); // prep + delivery
                }
                orderRepository.save(order);
                log.info("Order {} confirmed by restaurant {}", event.getOrderId(), event.getRestaurantName());
            }
        } catch (Exception e) {
            log.error("Failed to handle order-accepted for orderId={}: {}", event.getOrderId(), e.getMessage());
        }
    }

    // ─── Helper ────────────────────────────────────────────────────────

    public Order getOrderEntity(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
    }

    private BigDecimal[] fetchRestaurantCoordinates(String restaurantId) {
        if (restaurantId == null || restaurantId.isBlank()) return null;
        try {
            org.springframework.web.client.RestClient rc = org.springframework.web.client.RestClient.create();
            java.util.Map res = rc.get()
                    .uri("http://localhost:8082/restaurants/{id}", restaurantId)
                    .retrieve()
                    .body(java.util.Map.class);
            if (res != null && res.get("latitude") != null && res.get("longitude") != null) {
                return new BigDecimal[]{
                        new BigDecimal(res.get("latitude").toString()),
                        new BigDecimal(res.get("longitude").toString())
                };
            }
        } catch (Exception e) {
            log.warn("Could not fetch restaurant coordinates for {}: {}", restaurantId, e.getMessage());
        }
        return null;
    }
}
