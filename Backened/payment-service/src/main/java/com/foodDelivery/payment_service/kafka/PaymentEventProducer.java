package com.foodDelivery.payment_service.kafka;

import com.foodDelivery.payment_service.dto.PaymentCompletedEvent;
import com.foodDelivery.payment_service.dto.PaymentFailedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendPaymentCompleted(PaymentCompletedEvent event) {
        log.info("Publishing payment-completed: orderId={}, amount={}",
                event.getOrderId(), event.getTotalAmount());

        kafkaTemplate.send("payment-completed", event.getOrderId(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish payment-completed for orderId={}: {}",
                                event.getOrderId(), ex.getMessage());
                    } else {
                        log.info("payment-completed published: orderId={}, partition={}, offset={}",
                                event.getOrderId(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });
    }

    public void sendPaymentFailed(PaymentFailedEvent event) {
        log.error("Publishing payment-failed: orderId={}, reason={}",
                event.getOrderId(), event.getReason());

        kafkaTemplate.send("payment-failed", event.getOrderId(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish payment-failed for orderId={}: {}",
                                event.getOrderId(), ex.getMessage());
                    } else {
                        log.info("payment-failed published: orderId={}", event.getOrderId());
                    }
                });
    }
}
