package com.foodDelivery.payment_service.dto;

import com.foodDelivery.payment_service.domain.Transaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private String txnId;
    private String orderId;
    private String txnType;
    private BigDecimal amount;
    private String description;
    private BigDecimal balanceAfter;
    private LocalDateTime createdAt;

    public  static  TransactionResponse fromEntity(Transaction txn ){
        return TransactionResponse.builder()
                .txnId(txn.getTxnID())
                .orderId(txn.getOrderId())
                .txnType(txn.getTxnType().name())
                .amount(txn.getAmount())
                .description(txn.getDescription())
                .balanceAfter(txn.getBalanceAfter())
                .createdAt(txn.getCreatedAt())
                .build();
    }
}
