package com.foodDelivery.delivery_service.repository;

import com.foodDelivery.delivery_service.domain.Driver;
import com.foodDelivery.delivery_service.domain.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepo  extends JpaRepository<Driver , String > {
    Optional<Driver> findByUserId(String userId);

    List<Driver> findByStatus(DriverStatus status);

    boolean existsByUserId(String userId);

}
