package com.foodDelivery.user_service.repository;

import com.foodDelivery.user_service.domain.Address;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AddressRepository extends JpaRepository<Address , String> {

    List<Address> findByUserUserId(String userId);
}
