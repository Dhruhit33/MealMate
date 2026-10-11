package com.foodDelivery.payment_service.kafka;

import com.foodDelivery.payment_service.dto.DeliveryCompletedEvent;
import com.foodDelivery.payment_service.service.SettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeliveryCompletedConsumer {
    private  final SettlementService service;


    //listen to delivery complete event
    @KafkaListener(topics = "delivery-completed" , groupId = "payment-service-group")
    public  void  handleDeliveryCompleted(DeliveryCompletedEvent event){
        log.info("Received delivery-completed: orderId={}, userId={}, driverId={}",
                event.getOrderId(), event.getUserId(), event.getDriverId());
        service.settlePayment(event);

    }
}
