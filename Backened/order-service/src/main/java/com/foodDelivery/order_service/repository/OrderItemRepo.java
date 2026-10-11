package com.foodDelivery.order_service.repository;

import com.foodDelivery.order_service.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemRepo extends JpaRepository<OrderItem,String> {

    List<OrderItem> findByOrderOrderId(String orderId);
}
