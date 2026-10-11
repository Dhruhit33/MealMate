package com.foodDelivery.payment_service.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data

public class AddFundRequest {

    @NotNull(message = "Amount is required ")
    @DecimalMin(value = "1.00" , message = "Minimum add amount is 1.00")
    private BigDecimal amount ;
}
