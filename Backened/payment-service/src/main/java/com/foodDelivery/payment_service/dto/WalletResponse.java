package com.foodDelivery.payment_service.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {
    private String walletId ;
    private String userId ;
    private  BigDecimal totalBalance;
    private BigDecimal lockedBalance ;
    private BigDecimal availableBalance;
}
