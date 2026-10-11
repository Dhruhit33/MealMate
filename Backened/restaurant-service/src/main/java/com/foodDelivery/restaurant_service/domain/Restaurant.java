package com.foodDelivery.restaurant_service.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name ="restaurants" , indexes = {
        @Index(name = "idx_cuisine" , columnList = "cuisineType"),
        @Index(name = "idx_location" , columnList = "latitude, longitude"),
        @Index(name ="idx_rating" , columnList = "avgRating")
})

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String restaurantId;

    @Column(nullable = false)
    private String ownerId;

    @Column(nullable = false,length = 200)
    private String name ;

    @Column(columnDefinition = "TEXT")
    private String description ;

    @Column(nullable = false, length = 100)
    private String cuisineType;  // 'North Indian', 'Chinese', 'Italian'

    @Column(nullable = false, length = 500)
    private String address;

    @Column(nullable = false, precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(precision = 2, scale = 1)
    @Builder.Default
    private BigDecimal avgRating = BigDecimal.ZERO;

    @Builder.Default
    private Integer totalReviews = 0;

    @Builder.Default
    private Integer avgDeliveryTimeMins = 30;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Builder.Default
    private Boolean isOpen = true;

    private LocalTime openingTime;
    private LocalTime closingTime;

    @Column(length = 500)
    private String imageUrl;

    @Column(length = 15)
    private String phone;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Category> categories = new ArrayList<>();

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MenuItem> menuItems = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

}
