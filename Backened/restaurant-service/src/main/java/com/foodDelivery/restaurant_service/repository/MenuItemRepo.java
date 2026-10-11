package com.foodDelivery.restaurant_service.repository;

import com.foodDelivery.restaurant_service.domain.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemRepo  extends JpaRepository<MenuItem , String> {


    List<MenuItem> findByRestaurantRestaurantId(String restaurantId);
    List<MenuItem> findByRestaurantRestaurantIdAndIsAvailableTrue(String restaurantId);
    List<MenuItem> findByRestaurantRestaurantIdAndCategoryCategoryId(String restaurantId, String categoryId);
    List<MenuItem> findByRestaurantRestaurantIdAndIsVegTrue(String restaurantId);
    List<MenuItem> findByRestaurantRestaurantIdAndIsBestsellerTrue(String restaurantId);
    List<MenuItem> findByNameContainingIgnoreCaseAndRestaurantRestaurantId(String name, String restaurantId);
}
