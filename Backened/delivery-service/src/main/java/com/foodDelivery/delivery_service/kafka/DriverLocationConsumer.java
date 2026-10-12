package com.foodDelivery.delivery_service.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodDelivery.delivery_service.kafka.event.DriverLocationEvent;
import com.foodDelivery.delivery_service.repository.DriverRepo;
import com.foodDelivery.delivery_service.service.DriverMatchingService;
import com.foodDelivery.delivery_service.service.TrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class DriverLocationConsumer {

    private final DriverRepo driverRepo;
    private final DriverMatchingService driverMatchingService;
    private final TrackingService trackingService;
    private final ObjectMapper objectMapper;

    /**
     * Consumes driver locations from regional Kafka topics/partitions,
     * updates database (PostgreSQL), updates Redis Geo, and broadcasts to customer via WebSocket.
     */
    @KafkaListener(
            topics = {
                    "driver-location-ahmedabad",
                    "driver-location-gandhinagar",
                    "driver-location-rajkot",
                    "driver-location-surat",
                    "driver-location-vadodara",
                    "driver-location-general"
            },
            groupId = "delivery-service-driver-location-group"
    )
    @Transactional
    public void consumeDriverLocation(
            @Payload Object payload,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition
    ) {
        try {
            DriverLocationEvent event = null;
            if (payload instanceof org.apache.kafka.clients.consumer.ConsumerRecord<?, ?> record) {
                payload = record.value();
            }

            if (payload instanceof DriverLocationEvent) {
                event = (DriverLocationEvent) payload;
            } else if (payload instanceof String str) {
                event = objectMapper.readValue(str, DriverLocationEvent.class);
            } else if (payload instanceof byte[] bytes) {
                event = objectMapper.readValue(bytes, DriverLocationEvent.class);
            } else if (payload != null) {
                event = objectMapper.convertValue(payload, DriverLocationEvent.class);
            }

            if (event == null || event.getDriverId() == null || event.getLatitude() == null || event.getLongitude() == null) {
                return;
            }

            log.debug("Consumed from Kafka topic '{}' partition {}: driverId={}, lat={}, lng={}",
                    topic, partition, event.getDriverId(), event.getLatitude(), event.getLongitude());

            final Double lat = event.getLatitude();
            final Double lng = event.getLongitude();

            // 1. Update DB (drivers table in PostgreSQL)
            driverRepo.findById(event.getDriverId()).ifPresent(driver -> {
                driver.setCurrentLatitude(BigDecimal.valueOf(lat));
                driver.setCurrentLongitude(BigDecimal.valueOf(lng));
                driver.setUpdatedAt(LocalDateTime.now());
                driverRepo.save(driver);
            });

            // 2. Update Redis Geo for matching
            driverMatchingService.updateDriverLocation(
                    event.getDriverId(),
                    event.getLatitude(),
                    event.getLongitude()
            );

            // 3. Broadcast real-time location via WebSocket to customer tracking map
            trackingService.broadcastDriverLocation(
                    event.getDriverId(),
                    event.getLatitude(),
                    event.getLongitude()
            );

        } catch (Exception ex) {
            log.error("Failed to process driver location message from Kafka: {}", ex.getMessage(), ex);
        }
    }
}
