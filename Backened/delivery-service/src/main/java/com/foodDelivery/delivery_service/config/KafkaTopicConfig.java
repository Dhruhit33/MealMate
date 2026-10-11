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
    public  NewTopic deliveryCompletedTopic (){
        return TopicBuilder.name("delivery-completed")
                .partitions(12)
                .replicas(1)
                .build();
    }


}
