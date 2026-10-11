package com.foodDelivery.payment_service.controller;


import com.foodDelivery.payment_service.dto.TransactionResponse;
import com.foodDelivery.payment_service.repository.TransactionRepo;
import com.foodDelivery.payment_service.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private  final TransactionRepo transactionRepo;
    private  final JwtService jwtService;

    // get full transaction for the authenticated user

    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyTransactions(
            @RequestHeader("Authorization") String token) {

        String userId = extractUserId(token);
        List<TransactionResponse> transactions = transactionRepo
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(TransactionResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(Map.of(
                "count", transactions.size(),
                "transactions", transactions
        ));
    }
    //get all transaction for specific order

    @GetMapping("/order/{orderId}")
    public  ResponseEntity<List<TransactionResponse>> getOrderTransaction (@PathVariable String orderId ){
        return ResponseEntity.ok(
                transactionRepo.findByOrderIdOrderByCreatedAtDesc(orderId)
                        .stream()
                        .map(TransactionResponse::fromEntity)
                        .toList()
        );
    }


    private String extractUserId(String token) {
        return jwtService.extractUserId(token.replace("Bearer ", ""));
    }
}
