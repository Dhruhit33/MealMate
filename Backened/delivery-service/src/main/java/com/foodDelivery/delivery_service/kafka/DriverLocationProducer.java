package com.foodDelivery.delivery_service.kafka;

import com.foodDelivery.delivery_service.kafka.event.DriverLocationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class DriverLocationProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Publishes driver real-time location to region-wise Kafka topics.
     * driverId is used as the partition key so updates for each driver remain strictly ordered
     * across partitions.
     */
    public void publishLocation(DriverLocationEvent event) {
        String region = resolveRegion(event.getLatitude(), event.getLongitude(), event.getRegion());
        event.setRegion(region);

        String topic = "driver-location-" + region;
        String partitionKey = event.getDriverId();

        log.debug("Publishing driver location to Kafka: topic={}, driverId={}, lat={}, lng={}",
                topic, partitionKey, event.getLatitude(), event.getLongitude());

        kafkaTemplate.send(topic, partitionKey, event).whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish driver location to topic {}: {}", topic, ex.getMessage());
            } else {
                log.debug("Published driver location: driverId={}, topic={}, partition={}",
                        event.getDriverId(), topic, result.getRecordMetadata().partition());
            }
        });
    }

    /**
     * Resolves region based on explicit hint or geographic coordinates in Gujarat.
     */
    public static String resolveRegion(Double lat, Double lng, String explicitRegion) {
        if (explicitRegion != null && !explicitRegion.isBlank()) {
            String clean = explicitRegion.trim().toLowerCase();
            if (clean.contains("gandhinagar") || clean.contains("adalaj") || clean.contains("annapurnadham")) return "gandhinagar";
            if (clean.contains("ahmedabad") || clean.contains("amdavad")) return "ahmedabad";
            if (clean.contains("rajkot")) return "rajkot";
            if (clean.contains("surat")) return "surat";
            if (clean.contains("vadodara") || clean.contains("baroda")) return "vadodara";
        }
        if (lat == null || lng == null) return "ahmedabad";

        // Geo-fencing coordinates for Gujarat regions:
        // Adalaj / Gandhinagar area
        if (lat >= 23.12 && lat <= 23.35 && lng >= 72.54 && lng <= 72.75) {
            return "gandhinagar";
        }
        // Surat area
        if (lat >= 21.05 && lat <= 21.35 && lng >= 72.70 && lng <= 73.00) {
            return "surat";
        }
        // Vadodara area
        if (lat >= 22.15 && lat <= 22.45 && lng >= 73.05 && lng <= 73.35) {
            return "vadodara";
        }
        // Rajkot area
        if (lat >= 22.15 && lat <= 22.45 && lng >= 70.65 && lng <= 70.95) {
            return "rajkot";
        }
        // Default to Ahmedabad
        return "ahmedabad";
    }
}
