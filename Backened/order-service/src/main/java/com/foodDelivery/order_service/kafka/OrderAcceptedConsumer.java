package com.foodDelivery.order_service.kafka;


import com.foodDelivery.order_service.dto.OrderAcceptedEvent;
import com.foodDelivery.order_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class OrderAcceptedConsumer {
    private final OrderService orderService;
    @KafkaListener(topics = "order-accepted" , groupId = "order-service-group")
    public void handleOrderAccepted(OrderAcceptedEvent event){
        log.info("Received order-accepted: orderId={}, restaurant={}, prepTime={}min",
                event.getOrderId(),event.getRestaurantName(),event.getEstimatedPrepTimeMins());

        orderService.handleOrderAccepted(event);


    }
}
