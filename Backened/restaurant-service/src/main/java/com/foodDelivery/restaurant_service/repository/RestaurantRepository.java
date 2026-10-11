package com.foodDelivery.restaurant_service.repository;

import com.foodDelivery.restaurant_service.domain.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RestaurantRepository extends JpaRepository<Restaurant, String> {

    List<Restaurant> findByOwnerId(String ownerId);

    List<Restaurant> findByCuisineTypeContainingIgnoreCase(String cuisineType);

    List<Restaurant> findByIsOpenTrue();

    @Query("SELECT r FROM Restaurant r WHERE LOWER(r.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(r.cuisineType) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Restaurant> searchByKeyword(@Param("keyword") String keyword);

    // Haversine formula — find restaurants within a radius (in km)
    // Returns restaurants sorted by distance
    @Query(value = """
            SELECT *, (
                6371 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(latitude))
                    * COS(RADIANS(longitude) - RADIANS(:lng))
                    + SIN(RADIANS(:lat)) * SIN(RADIANS(latitude))
                )
            ) AS distance_km
            FROM restaurants
            WHERE is_open = true
            HAVING distance_km <= :radius
            ORDER BY distance_km ASC
            """, nativeQuery = true)
    List<Object[]> findNearbyRestaurants(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radius") double radiusKm
    );

    // Search nearby + filter by cuisine
    @Query(value = """
            SELECT *, (
                6371 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(latitude))
                    * COS(RADIANS(longitude) - RADIANS(:lng))
                    + SIN(RADIANS(:lat)) * SIN(RADIANS(latitude))
                )
            ) AS distance_km
            FROM restaurants
            WHERE is_open = true
            AND LOWER(cuisine_type) LIKE LOWER(CONCAT('%', :cuisine, '%'))
            HAVING distance_km <= :radius
            ORDER BY distance_km ASC
            """, nativeQuery = true)
    List<Object[]> findNearbyByCuisine(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radius") double radiusKm,
            @Param("cuisine") String cuisine
    );

    // Top rated restaurants
    @Query("SELECT r FROM Restaurant r WHERE r.isOpen = true ORDER BY r.avgRating DESC")
    List<Restaurant> findTopRated();
}
