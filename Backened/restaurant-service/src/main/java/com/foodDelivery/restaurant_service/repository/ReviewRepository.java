package com.foodDelivery.restaurant_service.repository;

import com.foodDelivery.restaurant_service.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, String> {

    List<Review> findByRestaurantRestaurantIdOrderByCreatedAtDesc(String restaurantId);

    Optional<Review> findByRestaurantRestaurantIdAndUserId(String restaurantId, String userId);

    boolean existsByRestaurantRestaurantIdAndUserId(String restaurantId, String userId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.restaurant.restaurantId = :restaurantId")
    Double calculateAverageRating(@Param("restaurantId") String restaurantId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.restaurant.restaurantId = :restaurantId")
    Integer countByRestaurantId(@Param("restaurantId") String restaurantId);
}