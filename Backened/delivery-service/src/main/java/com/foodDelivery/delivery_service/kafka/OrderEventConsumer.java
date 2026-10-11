package com.foodDelivery.delivery_service.kafka;


import com.foodDelivery.delivery_service.dto.OrderCancelledEvent;
import com.foodDelivery.delivery_service.dto.OrderPlacedEvent;
import com.foodDelivery.delivery_service.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final DeliveryService deliveryService;

    //consume order placed event from orderService
    //create a delivery record and attempt to match a driver

    @KafkaListener(topics = "order-placed" , groupId = "delivery-service-group")
    public  void  handleOrderPlaced(OrderPlacedEvent event){
        log.info("Received order-placed: orderId={}, restaurant={}",
                event.getOrderId(),event.getRestaurantName());

        try{
            deliveryService.createDelivery(event);
        }catch (Exception ex ){
            log.error("Failed to process order-placed event for orderId={}: {}",
                    event.getOrderId(), ex.getMessage());
            // Event will be retried by Kafka
        }
    }

    // Consumes order-cancelled events from order service
    // Cancel the delivery and release the driver

    @KafkaListener(topics = "order-cancelled" , groupId = "delivery-service-group")
    public  void handleOrderCancelled(OrderCancelledEvent event){
        log.info("Received order-cancelled: orderId={}, reason={}",
                event.getOrderId() , event.getReason());

        try{
            deliveryService.cancelDelivery(event.getOrderId(), event.getReason());
        }catch (Exception ex ){
            log.error("Failed to process order-cancelled event for orderId={}: {}",
                    event.getOrderId()  , ex.getMessage());
        }

    }
}
