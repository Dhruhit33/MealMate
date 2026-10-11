package com.foodDelivery.restaurant_service.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "menu_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    @JsonIgnore
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonIgnore
    private Category category;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(length = 500)
    private String imageUrl;

    @Builder.Default
    private Boolean isVeg = true;

    @Builder.Default
    private Boolean isAvailable = true;

    @Builder.Default
    private Boolean isBestseller = false;

    // Store categoryId for response (avoids lazy loading issues)
    @Transient
    public String getCategoryId() {
        return category != null ? category.getCategoryId() : null;
    }

    @Transient
    public String getCategoryName() {
        return category != null ? category.getName() : null;
    }
}
