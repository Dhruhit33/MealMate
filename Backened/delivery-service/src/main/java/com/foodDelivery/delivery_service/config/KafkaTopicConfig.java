package com.foodDelivery.delivery_service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig  {

    @Bean
    public NewTopic driverAssignedTopic(){
        return TopicBuilder.name("driver-assigned")
                .partitions(12)
                .replicas(1)
                .build();
    }
    @Bean
    public  NewTopic deliveryPickedUpTopic(){
        return TopicBuilder.name("delivery-picked-up")
                .partitions(12)
                .replicas(1)
                .build();
    }
    @Bean
    public NewTopic deliveryCompletedTopic (){
        return TopicBuilder.name("delivery-completed")
                .partitions(12)
                .replicas(1)
                .build();
    }

    // Region-wise Kafka Topics for Driver Real-Time Locations
    @Bean
    public NewTopic driverLocationAhmedabadTopic() {
        return TopicBuilder.name("driver-location-ahmedabad")
                .partitions(6)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic driverLocationGandhinagarTopic() {
        return TopicBuilder.name("driver-location-gandhinagar")
                .partitions(6)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic driverLocationRajkotTopic() {
        return TopicBuilder.name("driver-location-rajkot")
                .partitions(6)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic driverLocationSuratTopic() {
        return TopicBuilder.name("driver-location-surat")
                .partitions(6)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic driverLocationVadodaraTopic() {
        return TopicBuilder.name("driver-location-vadodara")
                .partitions(6)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic driverLocationGeneralTopic() {
        return TopicBuilder.name("driver-location-general")
                .partitions(6)
                .replicas(1)
                .build();
    }


}
