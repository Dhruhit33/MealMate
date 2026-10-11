package com.foodDelivery.restaurant_service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic orderAcceptedTopic(){
        return TopicBuilder.name("order-accepted")
                .partitions(6)
                .replicas(1)  // use 3 in prod
                .build();
    }

    @Bean
    public NewTopic orderPlacedTopic(){
        return TopicBuilder.name("order-placed")
                .partitions(12)
                .replicas(1)
                .build();
    }

}
