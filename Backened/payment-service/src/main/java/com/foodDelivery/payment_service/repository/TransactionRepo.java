package com.foodDelivery.payment_service.repository;

import com.foodDelivery.payment_service.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepo extends JpaRepository <Transaction , String>{
    List<Transaction>  findByUserIdOrderByCreatedAtDesc(String userId );
    List<Transaction> findByOrderIdOrderByCreatedAtDesc(String orderId);
}
