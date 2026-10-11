package com.foodDelivery.payment_service.service;

import com.foodDelivery.payment_service.domain.FundLock;
import com.foodDelivery.payment_service.domain.Transaction;
import com.foodDelivery.payment_service.domain.Wallet;
import com.foodDelivery.payment_service.dto.DeliveryCompletedEvent;
import com.foodDelivery.payment_service.dto.PaymentCompletedEvent;
import com.foodDelivery.payment_service.dto.PaymentFailedEvent;
import com.foodDelivery.payment_service.exception.ResourceNotFoundException;
import com.foodDelivery.payment_service.kafka.PaymentEventProducer;
import com.foodDelivery.payment_service.repository.FundLockRepo;
import com.foodDelivery.payment_service.repository.TransactionRepo;
import com.foodDelivery.payment_service.repository.WalletRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementService {

    private final WalletRepo walletRepo;
    private final FundLockRepo fundLockRepo;
    private  final TransactionRepo transactionRepo;
    private  final PaymentEventProducer paymentEventProducer;

    @Value("${payment.settlement.max-retries:3}")
    private int maxRetries;

    @Value("${payment.settlement.platform-fee-percent:5.0}")
    private double platformFeePercent;

    /**
     * SAGA Step 4: Settle payment after delivery is confirmed.
     *
     * Flow:
     * 1. Find the fund lock for this order
     * 2. Deduct from user's total balance (locked amount becomes real deduction)
     * 3. Reduce locked balance
     * 4. Mark lock as SETTLED
     * 5. Record DEBIT transaction
     * 6. Publish payment-completed event
     *
     * On failure: retry up to maxRetries, then publish payment-failed to DLQ.
     */

    public  void  settlePayment (DeliveryCompletedEvent event){
        int attempt =0;

        while (attempt<maxRetries){
            attempt++;
            try{
                doSettle(event);
                log.info("Payment settled for orderId={} on attempt {}", event.getOrderId(), attempt);
              return;
            }
            catch (Exception ex){
                log.warn("Settlement attempt {}/{} failed for orderId={}: {}",
                        attempt , maxRetries, event.getOrderId() , ex.getMessage());

                if (attempt >= maxRetries){
                    log.error("Settlement FAILED after {} attempts for orderId={}. Sending to DLQ.",
                            maxRetries , event.getOrderId());

                    paymentEventProducer.sendPaymentFailed(PaymentFailedEvent.builder()
                            .orderId(event.getOrderId())
                            .userId(event.getUserId())
                            .reason("Settlement failed after " + maxRetries + " attempts: " + ex.getMessage())
                            .attemptCount(maxRetries)
                            .failedAt(LocalDateTime.now())
                            .build());


                }


            }
        }
    }
    @Transactional
     protected void  doSettle(DeliveryCompletedEvent event){
        //find the active lock
        FundLock lock = fundLockRepo.findByOrderIdAndStatus(event.getOrderId() , FundLock.LockStatus.LOCKED)
                .orElseThrow(()-> new ResourceNotFoundException(
                        "No active fund lock for the order :" + event.getOrderId()
                ));
        //get user wallet
        Wallet wallet = walletRepo.findByUserId(event.getUserId())
                .orElseThrow(()->new ResourceNotFoundException(
                        "wallet not found for the user:" + event.getUserId()
                ));
        BigDecimal amount = lock.getAmount();
        //deduct from total balance + reduce locked balance
        wallet.setTotalBalance(wallet.getTotalBalance().subtract(amount));
        wallet.setLockedBalance(wallet.getLockedBalance().subtract(amount));
        walletRepo.save(wallet);

        //mark lock as settled
        lock.setStatus(FundLock.LockStatus.SETTLED);
        lock.setSettledAt(LocalDateTime.now());
        fundLockRepo.save(lock);

        //Record debit Transaction
        transactionRepo.save(Transaction.builder()
                        .userId(event.getUserId())
                        .orderId(event.getOrderId())
                        .txnType(Transaction.TxnType.DEBIT)
                        .amount(amount)
                        .description("Payment settled for order :" + event.getOrderId())
                        .balanceAfter(wallet.getAvailableBalance())
                .build());
        // 6. Calculate platform fee and restaurant payout
        BigDecimal platformFee = amount.multiply(BigDecimal.valueOf(platformFeePercent / 100))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal restaurantPayout = amount.subtract(platformFee);

        //publish payment-completed event
        paymentEventProducer.sendPaymentCompleted(PaymentCompletedEvent.builder()
                        .orderId(event.getOrderId())
                        .userId(event.getUserId())
                        .restaurantId(event.getRestaurantId())
                        .totalAmount(amount)
                        .platformFee(platformFee)
                        .restaurantPayout(restaurantPayout)
                        .settledAt(LocalDateTime.now())
                        .userEmail(event.getUserEmail())
                        .userName(event.getUserName())
                .build());
        log.info("Settled orderId={}: total={}, platformFee={}, restaurantPayout={}, userBalance={}",
                event.getOrderId(), amount, platformFee, restaurantPayout, wallet.getAvailableBalance());

     }




}
