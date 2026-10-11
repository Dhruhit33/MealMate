package com.foodDelivery.restaurant_service.dto;

import com.foodDelivery.restaurant_service.domain.Restaurant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantResponse {
    private String restaurantId;
    private String ownerId;
    private String name;
    private String description;
    private String cuisineType;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal avgRating;
    private Integer totalReviews;
    private Integer avgDeliveryTimeMins;
    private BigDecimal minOrderAmount;
    private Boolean isOpen;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private String imageUrl;
    private String phone;
    private Double distanceKm;  // Calculated field for nearby search

    public static RestaurantResponse fromEntity(Restaurant r) {
        return RestaurantResponse.builder()
                .restaurantId(r.getRestaurantId())
                .ownerId(r.getOwnerId())
                .name(r.getName())
                .description(r.getDescription())
                .cuisineType(r.getCuisineType())
                .address(r.getAddress())
                .latitude(r.getLatitude())
                .longitude(r.getLongitude())
                .avgRating(r.getAvgRating())
                .totalReviews(r.getTotalReviews())
                .avgDeliveryTimeMins(r.getAvgDeliveryTimeMins())
                .minOrderAmount(r.getMinOrderAmount())
                .isOpen(r.getIsOpen())
                .openingTime(r.getOpeningTime())
                .closingTime(r.getClosingTime())
                .imageUrl(r.getImageUrl())
                .phone(r.getPhone())
                .build();
    }

}
