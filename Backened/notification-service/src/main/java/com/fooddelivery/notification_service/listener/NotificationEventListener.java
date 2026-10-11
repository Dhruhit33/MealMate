package com.fooddelivery.notification_service.listener;

import com.fooddelivery.notification_service.dto.NotificationEvent;
import com.fooddelivery.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final EmailService emailService;

    @KafkaListener(topics = "order-placed", groupId = "notification-service-group")
    public void handleOrderPlaced(NotificationEvent event) {
        log.info("Received order-placed event: {}", event.getOrderId());
        if (event.getUserEmail() == null) {
            log.warn("No userEmail in order-placed event, skipping");
            return;
        }
        Map<String, Object> vars = new HashMap<>();
        vars.put("userName", event.getUserName() != null ? event.getUserName() : "Customer");
        vars.put("orderId", event.getOrderId());
        vars.put("restaurantName", event.getRestaurantName());
        vars.put("totalAmount", event.getTotalAmount() != null
                ? event.getTotalAmount().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString()
                : "0.00");
        emailService.sendHtmlEmail(
                event.getUserEmail(),
                "Order Confirmed - #" + event.getOrderId(),
                "order-placed",
                vars,
                "ORDER_PLACED"
        );
    }

    @KafkaListener(topics = "payment-completed", groupId = "notification-service-group")
    public void handlePaymentSuccess(NotificationEvent event) {
        log.info("Received payment-completed event: orderId={}", event.getOrderId());
        if (event.getUserEmail() == null) {
            log.warn("No userEmail in payment-completed event, skipping");
            return;
        }
        Map<String, Object> vars = new HashMap<>();
        vars.put("userName", event.getUserName() != null ? event.getUserName() : "Customer");
        vars.put("orderId", event.getOrderId());
        vars.put("totalAmount", event.getTotalAmount() != null
                ? event.getTotalAmount().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString()
                : "0.00");
        emailService.sendHtmlEmail(
                event.getUserEmail(),
                "Payment Received - #" + event.getOrderId(),
                "payment-success",
                vars,
                "PAYMENT_SUCCESS"
        );
    }
}
