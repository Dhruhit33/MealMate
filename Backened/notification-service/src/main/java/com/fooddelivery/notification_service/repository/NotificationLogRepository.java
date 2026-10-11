package com.fooddelivery.notification_service.repository;

import com.fooddelivery.notification_service.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
}
