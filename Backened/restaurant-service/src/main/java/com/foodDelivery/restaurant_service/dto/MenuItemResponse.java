package com.foodDelivery.restaurant_service.dto;


import com.foodDelivery.restaurant_service.domain.MenuItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MenuItemResponse {
    private String itemId;
    private String restaurantId;
    private String categoryId;
    private String categoryName ;
    private String name ;
    private String description ;
    private BigDecimal price ;
    private String imageUrl;
    private Boolean isVeg ;
    private Boolean isAvailable ;
    private Boolean isBestseller;

    public  static MenuItemResponse fromEntity(MenuItem item){
        return MenuItemResponse.builder()
                .itemId(item.getItemId())
                .restaurantId(item.getRestaurant().getRestaurantId())
                .categoryId(item.getCategoryId())
                .categoryName(item.getCategoryName())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .isVeg(item.getIsVeg())
                .isAvailable(item.getIsAvailable())
                .isBestseller(item.getIsBestseller())
                .build();
    }


}
