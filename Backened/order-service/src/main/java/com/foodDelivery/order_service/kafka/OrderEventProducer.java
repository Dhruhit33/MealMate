package com.foodDelivery.order_service.kafka;

import com.foodDelivery.order_service.dto.OrderCancelledEvent;
import com.foodDelivery.order_service.dto.OrderPlacedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class OrderEventProducer {

    private final KafkaTemplate<String,Object> kafkaTemplate;

    public void sendOrderPlaced(OrderPlacedEvent event) {
        log.info("Publishing order-placed: orderId={}, restaurant={}",
                event.getOrderId(), event.getRestaurantName());

        kafkaTemplate.send("order-placed", event.getOrderId(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish order-placed: {}", ex.getMessage());
                    } else {
                        log.info("order-placed published: orderId={}, partition={}, offset={}",
                                event.getOrderId(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });
    }

    public  void sendOrderCancelled(OrderCancelledEvent event){
        log.info("Publishing order-cancelled: orderId={}, reason={}",
                event.getOrderId(),event.getReason());

        kafkaTemplate.send("order-cancelled", event.getOrderId(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish order-cancelled: {}", ex.getMessage());
                    } else {
                        log.info("order-cancelled published: orderId={}", event.getOrderId());
                    }
                });
    }
}
