package com.foodDelivery.payment_service.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fund_locks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FundLock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String lockId ;

    @Column(nullable = false, length = 36)
    private String walletId;

    @Column(unique = true,  nullable = false , length = 36)
    private String orderId ;

    @Column(nullable = false, length = 36)
    private String userId ;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount ;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private LockStatus status = LockStatus.LOCKED;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime settledAt;
    private LocalDateTime releasedAt;

    public enum LockStatus{
        LOCKED , SETTLED , RELEASED
    }




}
