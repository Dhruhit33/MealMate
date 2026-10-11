package com.foodDelivery.payment_service.repository;

import com.foodDelivery.payment_service.domain.FundLock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FundLockRepo extends JpaRepository<FundLock, String> {

    Optional<FundLock> findByOrderIdAndStatus(String orderId, FundLock.LockStatus status);
    boolean existsByOrderId(String orderId);
}