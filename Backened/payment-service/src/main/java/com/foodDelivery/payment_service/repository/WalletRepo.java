package com.foodDelivery.payment_service.repository;

import com.foodDelivery.payment_service.domain.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepo extends JpaRepository<Wallet , String> {

    Optional<Wallet> findByUserId(String userId );
    boolean existsByUserId (String userId );
}
