package com.foodDelivery.order_service.repository;

import com.foodDelivery.order_service.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepo  extends JpaRepository<Order,String> {

    List<Order>  findByUserIdOrderByCreatedAtDesc(String userId);

    List<Order> findByRestaurantIdOrderByCreatedAtDesc(String restaurantId);

    List<Order> findByStatus(Order.OrderStatus status);

    List<Order> findByUserIdAndStatus(String userId, Order.OrderStatus status);


    @Query("SELECT o FROM Order o WHERE o.restaurantId = :restaurantId AND o.status IN :statuses ORDER BY o.createdAt DESC")
    List<Order> findActiveOrdersForRestaurant(
            @Param("restaurantId") String restaurantId,
            @Param("statuses") List<Order.OrderStatus> statuses
    );

    @Query("SELECT o FROM Order o WHERE o.userId = :userId ORDER BY o.createdAt DESC LIMIT :limit")
    List<Order> findRecentByUserId(@Param("userId") String userId, @Param("limit") int limit);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.restaurantId = :restaurantId AND o.status IN ('CREATED','CONFIRMED','PREPARING')")
    Integer countActiveOrdersForRestaurant(@Param("restaurantId") String restaurantId);

}
