package com.foodDelivery.payment_service.domain;

import jakarta.persistence.*;
import jakarta.transaction.Transactional;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions" , indexes = {
        @Index(name = "idx_user_created" , columnList = "userId, createdAt")
})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String txnID ;

    @Column(nullable = false , length = 36)
    private String userId ;

    @Column(length = 36)
    private String  orderId ;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TxnType txnType ;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 500)
    private String description;

    @Column(precision = 12, scale = 2)
    private BigDecimal balanceAfter; // Snapshot of balance after this txn

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public  enum TxnType{
        CREDIT ,     // ADD FUND TO WALLET
        DEBIT,       // SETTLEMENT DEDUCTION
        LOCK,        //FUNDS LOCKED FOR ORDER
        RELEASE,     // FUND RELEASED (ORDER CANCELLED)
        REFUND       // REFUND AFTER SETTLEMENT

    }


}
