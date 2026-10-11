package com.foodDelivery.payment_service.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "wallets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private  String walletId ;

    @Column(unique = true, nullable = false, length = 36)
    private String userId ;


    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalBalance = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lockedBalance = BigDecimal.ZERO;

    @Version // Optimistic lock — prevents double-spend
    private Long version;

    public  BigDecimal getAvailableBalance(){
        return totalBalance.subtract(lockedBalance);
    }
    public  boolean hasSufficientBalance(BigDecimal amount ){
        return getAvailableBalance().compareTo(amount) >=0;
    }


}
