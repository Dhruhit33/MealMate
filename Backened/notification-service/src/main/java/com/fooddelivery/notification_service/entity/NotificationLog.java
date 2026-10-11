package com.fooddelivery.notification_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_log")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String recipientEmail;

    @Column(length = 500)
    private String subject;

    private String eventType;

    private String status;

    @Column(length = 1000)
    private String errorMessage;

    private LocalDateTime sentAt;
}
