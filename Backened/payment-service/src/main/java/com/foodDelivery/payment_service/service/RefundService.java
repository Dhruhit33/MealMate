package com.foodDelivery.payment_service.service;


import com.foodDelivery.payment_service.dto.OrderCancelledEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefundService {

    private  final  WalletService walletService;

    public  void handleOrderCancelled(OrderCancelledEvent event){
        try{
            walletService.releaseFunds(event.getOrderId());
            log.info("Refund processed for orderId={}, userId={}, reason={}",
                    event.getOrderId(), event.getUserId(), event.getReason());

        }catch(Exception ex){
            log.warn("No fund lock to release for orderId={}: {}", event.getOrderId(), ex.getMessage());

        }
    }
}
