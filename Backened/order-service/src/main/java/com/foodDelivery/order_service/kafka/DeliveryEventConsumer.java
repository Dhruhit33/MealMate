package com.foodDelivery.order_service.kafka;

import com.foodDelivery.order_service.domain.Order;
import com.foodDelivery.order_service.dto.DeliveryCompletedEvent;
import com.foodDelivery.order_service.dto.DeliveryPickedUpEvent;
import com.foodDelivery.order_service.dto.DriverAssignedEvent;
import com.foodDelivery.order_service.repository.OrderRepo;
import com.foodDelivery.order_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class DeliveryEventConsumer {

    private final OrderService orderService;
    private final OrderRepo orderRepository;

    @KafkaListener(topics = "driver-assigned", groupId = "order-service-group")
    public void handleDriverAssigned(DriverAssignedEvent event) {
        log.info("Received driver-assigned for orderId={}", event.getOrderId());
        try {
            Optional<Order> orderOpt = orderRepository.findById(event.getOrderId());
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                order.setDriverId(event.getDriverId());
                if (event.getEstimatedMins() != null) {
                    order.setEstimatedDeliveryMins(event.getEstimatedMins());
                }
                orderRepository.save(order);
                log.info("Updated order {} with driverId={}", event.getOrderId(), event.getDriverId());
            }
        } catch (Exception ex) {
            log.error("Failed to process driver-assigned: {}", ex.getMessage());
        }
    }

    @KafkaListener(topics = "delivery-picked-up", groupId = "order-service-group")
    public void handleDeliveryPickedUp(DeliveryPickedUpEvent event) {
        log.info("Received delivery-picked-up for orderId={}", event.getOrderId());
        try {
            Order order = orderService.getOrderEntity(event.getOrderId());
            // Force-transition through intermediate states if needed
            // This handles the case where restaurant hasn't moved the order to READY yet
            forceTransitionTo(order, Order.OrderStatus.PICKED_UP);
            orderRepository.save(order);
            log.info("Updated order {} status to PICKED_UP (from {})", event.getOrderId(), order.getStatus());
        } catch (Exception ex) {
            log.error("Failed to process delivery-picked-up: {}", ex.getMessage());
        }
    }

    @KafkaListener(topics = "delivery-completed", groupId = "order-service-group")
    public void handleDeliveryCompleted(DeliveryCompletedEvent event) {
        log.info("Received delivery-completed for orderId={}", event.getOrderId());
        try {
            Order order = orderService.getOrderEntity(event.getOrderId());
            // Force-transition through intermediate states if needed
            forceTransitionTo(order, Order.OrderStatus.DELIVERED);
            orderRepository.save(order);
            log.info("Updated order {} status to DELIVERED", event.getOrderId());
        } catch (Exception ex) {
            log.error("Failed to process delivery-completed: {}", ex.getMessage());
        }
    }

    /**
     * Force-transition an order through intermediate states to reach the target status.
     * This is needed because delivery events can arrive before restaurant status updates.
     * e.g. if order is CONFIRMED and we get PICKED_UP, we go: CONFIRMED→PREPARING→READY→PICKED_UP
     */
    private void forceTransitionTo(Order order, Order.OrderStatus target) {
        // Define the ordered state progression
        Order.OrderStatus[] progression = {
            Order.OrderStatus.CREATED,
            Order.OrderStatus.CONFIRMED,
            Order.OrderStatus.PREPARING,
            Order.OrderStatus.READY,
            Order.OrderStatus.PICKED_UP,
            Order.OrderStatus.DELIVERED,
            Order.OrderStatus.COMPLETED
        };

        // Already at or past target — nothing to do
        if (order.getStatus() == target) return;

        // Find current and target index
        int currentIdx = -1, targetIdx = -1;
        for (int i = 0; i < progression.length; i++) {
            if (progression[i] == order.getStatus()) currentIdx = i;
            if (progression[i] == target) targetIdx = i;
        }

        if (currentIdx == -1 || targetIdx == -1 || currentIdx >= targetIdx) {
            log.warn("Cannot force-transition order {} from {} to {} — skipping",
                    order.getOrderId(), order.getStatus(), target);
            return;
        }

        // Walk through each intermediate state
        for (int i = currentIdx + 1; i <= targetIdx; i++) {
            log.debug("Force-transitioning order {} from {} → {}",
                    order.getOrderId(), order.getStatus(), progression[i]);
            order.transitionTo(progression[i]);
        }
    }
}

