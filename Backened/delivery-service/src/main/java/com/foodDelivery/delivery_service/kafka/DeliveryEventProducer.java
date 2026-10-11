package com.foodDelivery.delivery_service.kafka;


import com.foodDelivery.delivery_service.dto.DeliveryCompletedEvent;
import com.foodDelivery.delivery_service.dto.DeliveryPickedUpEvent;
import com.foodDelivery.delivery_service.dto.DriverAssignedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class DeliveryEventProducer {

    private final KafkaTemplate<String , Object> kafkaTemplate;

    public  void sendDriverAssigned (DriverAssignedEvent event){
        log.info("Publishing driver-assigned: orderId={}, driverId={}",
                event.getOrderId(), event.getDriverId());

        kafkaTemplate.send("driver-assigned" , event.getOrderId(), event).whenComplete((result , ex) ->{
            if (ex!=null){
                log.error("failed to published driver assigned:{}", ex.getMessage());
            }else {
                log.info("driver-assigned published: orderId={}, partition={}, offset={}",
                        event.getOrderId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }
    public  void sendDeliveryPickedUp(DeliveryPickedUpEvent event){
        log.info("Publishing delivery-picked-up: orderId={}, driverId={}",
                event.getOrderId(), event.getDriverId());

        kafkaTemplate.send("delivery-picked-up" , event.getOrderId(), event).whenComplete((result , ex ) ->{
            if (ex!=null){
                log.error("Failed to publish delivery-picked-up: {}", ex.getMessage());

            }else {
                log.info("delivery-picked-up published: orderId={}", event.getOrderId());
            }
        });
    }
    public  void sendDeliveryCompleted(DeliveryCompletedEvent event){
        log.info("Publishing delivery-completed: orderId={}, driverId={}",
                event.getOrderId(), event.getDeliveryId());


        kafkaTemplate.send("delivery-completed", event.getOrderId() , event).whenComplete((result, ex)->{
            if (ex !=null ){
                log.error("Failed to publish delivery-completed: {}", ex.getMessage());
            }else {
                log.info("delivery-completed published: orderId={}, partition={}, offset={}",
                        event.getOrderId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());

            }
        });
    }
}
