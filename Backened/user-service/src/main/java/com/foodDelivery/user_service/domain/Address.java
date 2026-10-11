package com.foodDelivery.user_service.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String addressId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore

    private User user;

    @Column(nullable = false, length = 50)
    private String label ;   // homee / office/others

    @Column(nullable = false)
    private  String street ;

    @Column(nullable = false,length = 100)
    private String city ;

    @Column(nullable = false, length = 10)
    private String pincode ;

    @Column (nullable = false, precision = 10, scale = 8)
    private BigDecimal latitude ;

    @Column(nullable = false, precision = 11, scale = 8)
    private BigDecimal longitude ;


    @Column(columnDefinition = "boolean default false")
    private boolean isDefault ;
}
