package com.foodDelivery.payment_service.controller;


import com.foodDelivery.payment_service.dto.AddFundRequest;
import com.foodDelivery.payment_service.dto.LockFundsRequest;
import com.foodDelivery.payment_service.dto.WalletResponse;
import com.foodDelivery.payment_service.service.JwtService;
import com.foodDelivery.payment_service.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/wallet")
@RequiredArgsConstructor
public class WalletController {

    private  final WalletService walletService;
    private  final JwtService jwtService;


    //get current wallet balance for the current user

    @GetMapping("/balance")
    public ResponseEntity<WalletResponse> getBalance (@RequestHeader("Authorization") String token ){
        String userId = extractUserId(token);
        return ResponseEntity.ok(walletService.getBalance(userId));
    }

    @PostMapping("/create")
    public  ResponseEntity<WalletResponse> createWallet(@RequestHeader("Authorization") String token ){
        String userId = extractUserId(token);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(walletService.createWallet(userId));
    }
    @PostMapping("/add-funds")
    public ResponseEntity<WalletResponse> addFunds(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody AddFundRequest request) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(walletService.addFunds(userId, request.getAmount()));
    }


    @PostMapping("/lock")
    public ResponseEntity<WalletResponse> lockFunds(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody LockFundsRequest request) {

        String userId = extractUserId(token);
        return ResponseEntity.ok(walletService.lockFunds(userId, request.getOrderId(), request.getAmount()));
    }

    @PostMapping("/release/{orderId}")
    public ResponseEntity<Map<String, Object>> releaseFunds(
            @PathVariable String orderId,
            @RequestHeader("Authorization") String token) {

        WalletResponse wallet = walletService.releaseFunds(orderId);
        return ResponseEntity.ok(Map.of(
                "message", "Funds released for order " + orderId,
                "wallet", wallet
        ));
    }



    private String extractUserId(String token) {
        return jwtService.extractUserId(token.replace("Bearer ", ""));
    }
}
