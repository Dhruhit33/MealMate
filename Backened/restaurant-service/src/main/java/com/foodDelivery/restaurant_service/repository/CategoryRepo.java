package com.foodDelivery.restaurant_service.repository;

import com.foodDelivery.restaurant_service.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepo  extends JpaRepository<Category, String> {
    List<Category> findByRestaurantRestaurantIdOrderByDisplayOrderAsc(String restaurantId);
}
