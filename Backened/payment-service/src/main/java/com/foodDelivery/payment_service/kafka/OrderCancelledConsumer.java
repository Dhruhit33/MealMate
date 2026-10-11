package com.foodDelivery.payment_service.kafka;

import com.foodDelivery.payment_service.dto.OrderCancelledEvent;
import com.foodDelivery.payment_service.service.RefundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class OrderCancelledConsumer {

    private final RefundService refundService;

    //listeen for order cancelled
    //trigger SAGA Compensating action : release locked funds

    @KafkaListener(topics = "order-cancelled", groupId ="payment-service-group" )
    public  void handleOrderCancelled(OrderCancelledEvent event){
        log.info("Received order-cancelled: orderId={}, userId={}, reason={}",
                event.getOrderId(), event.getUserId(), event.getReason());

        refundService.handleOrderCancelled(event);
    }
}
