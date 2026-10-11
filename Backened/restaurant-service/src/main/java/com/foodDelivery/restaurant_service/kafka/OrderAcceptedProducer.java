package com.foodDelivery.restaurant_service.kafka;


import com.foodDelivery.restaurant_service.dto.OrderAcceptedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderAcceptedProducer {
    private final KafkaTemplate<String , OrderAcceptedEvent> kafkaTemplate;

    private static final String TOPIC = "order-accepted";

    public void sendOrderAccepted(OrderAcceptedEvent event){
        log.info("Publishing order-accepted event for orderId={}, restaurantId={}",
                event.getOrderId(), event.getRestaurantId());
        kafkaTemplate.send(TOPIC,event.getOrderId(),event)
                .whenComplete((result,ex)-> {

                      if (ex!=null){
                          log.error("Failed to publish order-accepted for orderId={}: {}",
                                  event.getOrderId(), ex.getMessage());
                      }
                      else {
                          log.info("order-accepted published successfully for orderId={}, partition={}, offset={}",
                                  event.getOrderId(),
                                  result.getRecordMetadata().partition(),
                                  result.getRecordMetadata().offset());

                      }

                        });

    }
}
