package com.foodDelivery.order_service.dto;

import com.foodDelivery.order_service.domain.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor

public class OrderItemResponse {

    private String itemId ;
    private String menuItemId;
    private String menuItemName;
    private Integer quantity;
    private BigDecimal unitPrice ;
    private BigDecimal totalPrice;

    public  static OrderItemResponse fromEntity(OrderItem item){
        return OrderItemResponse.builder()
                .itemId(item.getItemId())
                .menuItemId(item.getMenuItemId())
                .menuItemName(item.getMenuItemName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .build();
    }

}
