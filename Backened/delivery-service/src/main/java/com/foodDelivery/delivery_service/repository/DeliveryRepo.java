package com.foodDelivery.delivery_service.repository;

import com.foodDelivery.delivery_service.domain.Delivery;
import com.foodDelivery.delivery_service.domain.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepo extends JpaRepository<Delivery , String> {
    Optional<Delivery> findByOrderId(String orderId );

    List<Delivery> findByDriverIdAndStatusIn(String driverId , List<DeliveryStatus> statuses);
    List<Delivery> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Delivery> findByDriverIdOrderByCreatedAtDesc(String driverId);

    @Query("SELECT d FROM Delivery d WHERE d.driverId = :driverId AND d.status IN ('DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')")
    Optional<Delivery> findActiveDeliveryByDriverId(@Param("driverId") String driverId);

    @Query("SELECT d FROM Delivery d WHERE d.status = 'PENDING' ORDER BY d.createdAt ASC")
    List<Delivery> findPendingDeliveries();

    @Query("SELECT d FROM Delivery d WHERE d.userId = :userId AND d.status IN ('PENDING', 'DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')")
    List<Delivery> findActiveDeliveriesByUserId(@Param("userId") String userId);
}


