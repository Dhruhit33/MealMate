package com.foodDelivery.restaurant_service.dto;


import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CategoryRequest {


    @NotNull(message = "Category name is required ")
    private String name ;

    private String description ;
    private Integer  displayOrder;

}
