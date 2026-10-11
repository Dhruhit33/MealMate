package com.foodDelivery.restaurant_service.kafka;

import com.foodDelivery.restaurant_service.dto.OrderPlacedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderPlacedConsumer {


    @KafkaListener(topics = "order-placed", groupId = "restaurant-service-group")
    public void handleOrderPlaced(OrderPlacedEvent event){
        log.info("Received order-placed event: orderId={}, restaurantId={}, amount={}",
                event.getOrderId(), event.getRestaurantId(), event.getTotalAmount());

        log.info("Order {} is pending restaurant acceptance", event.getOrderId());
    }
}
