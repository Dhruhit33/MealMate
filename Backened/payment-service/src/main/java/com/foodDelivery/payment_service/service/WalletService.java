package com.foodDelivery.payment_service.service;

import com.foodDelivery.payment_service.domain.FundLock;
import com.foodDelivery.payment_service.domain.Transaction;
import com.foodDelivery.payment_service.domain.Wallet;
import com.foodDelivery.payment_service.dto.WalletResponse;
import com.foodDelivery.payment_service.exception.DuplicateLockException;
import com.foodDelivery.payment_service.exception.InsufficientBalanceException;
import com.foodDelivery.payment_service.exception.ResourceNotFoundException;
import com.foodDelivery.payment_service.repository.FundLockRepo;
import com.foodDelivery.payment_service.repository.TransactionRepo;
import com.foodDelivery.payment_service.repository.WalletRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepo walletRepository;
    private final FundLockRepo fundLockRepository;
    private final TransactionRepo transactionRepository;

    // ─── Create Wallet (called during user registration) ───────────────

    @Transactional
    public WalletResponse createWallet(String userId) {
        if (walletRepository.existsByUserId (userId)) {
            // Idempotent — return existing wallet
            return toResponse(walletRepository.findByUserId(userId).get());
        }

        Wallet wallet = Wallet.builder()
                .userId(userId)
                .totalBalance(BigDecimal.ZERO)
                .lockedBalance(BigDecimal.ZERO)
                .build();

        wallet = walletRepository.save(wallet);
        log.info("Wallet created for userId={}", userId);
        return toResponse(wallet);
    }

    // ─── Add Funds to Wallet ───────────────────────────────────────────

    @Transactional
    public WalletResponse addFunds(String userId, BigDecimal amount) {
        Wallet wallet = getWalletEntity(userId);

        wallet.setTotalBalance(wallet.getTotalBalance().add(amount));
        wallet = walletRepository.save(wallet);

        // Record transaction
        transactionRepository.save(Transaction.builder()
                .userId(userId)
                .txnType(Transaction.TxnType.CREDIT)
                .amount(amount)
                .description("Added funds to wallet")
                .balanceAfter(wallet.getTotalBalance())
                .build());

        log.info("Added {} to wallet for userId={}. New balance={}", amount, userId, wallet.getTotalBalance());
        return toResponse(wallet);
    }

    // ─── Lock Funds (SAGA Step 1 — called at order placement) ──────────

    @Transactional
    public WalletResponse lockFunds(String userId, String orderId, BigDecimal amount) {
        if (fundLockRepository.existsByOrderId(orderId)) {
            throw new DuplicateLockException("Funds already locked for order: " + orderId);
        }

        Wallet wallet = getWalletEntity(userId);

        if (!wallet.hasSufficientBalance(amount)) {
            throw new InsufficientBalanceException(
                    "Insufficient balance. Available: " + wallet.getAvailableBalance() + ", Required: " + amount);
        }
        wallet.setLockedBalance(wallet.getLockedBalance().add(amount));
        wallet = walletRepository.save(wallet);
        fundLockRepository.save(FundLock.builder()
                .walletId(wallet.getWalletId())
                .orderId(orderId)
                .userId(userId)
                .amount(amount)
                .status(FundLock.LockStatus.LOCKED)
                .build());
        transactionRepository.save(Transaction.builder()
                .userId(userId)
                .orderId(orderId)
                .txnType(Transaction.TxnType.LOCK)
                .amount(amount)
                .description("Funds locked for order " + orderId)
                .balanceAfter(wallet.getAvailableBalance())
                .build());

        log.info("Locked {} for orderId={}, userId={}. Available={}", amount, orderId, userId, wallet.getAvailableBalance());
        return toResponse(wallet);
    }

    // ─── Release Funds (SAGA Compensate — order cancelled) ─────────────

    @Transactional
    public WalletResponse releaseFunds(String orderId) {
        FundLock lock = fundLockRepository.findByOrderIdAndStatus(orderId, FundLock.LockStatus.LOCKED)
                .orElseThrow(() -> new ResourceNotFoundException("No active lock found for order: " + orderId));

        Wallet wallet = getWalletEntity(lock.getUserId());
        wallet.setLockedBalance(wallet.getLockedBalance().subtract(lock.getAmount()));
        wallet = walletRepository.save(wallet);
        lock.setStatus(FundLock.LockStatus.RELEASED);
        lock.setReleasedAt(java.time.LocalDateTime.now());
        fundLockRepository.save(lock);
        transactionRepository.save(Transaction.builder()
                .userId(lock.getUserId())
                .orderId(orderId)
                .txnType(Transaction.TxnType.RELEASE)
                .amount(lock.getAmount())
                .description("Funds released — order " + orderId + " cancelled")
                .balanceAfter(wallet.getAvailableBalance())
                .build());

        log.info("Released {} for orderId={}, userId={}. Available={}", lock.getAmount(), orderId, lock.getUserId(), wallet.getAvailableBalance());
        return toResponse(wallet);
    }

    // ─── Get Wallet Balance ────────────────────────────────────────────

    public WalletResponse getBalance(String userId) {
        return toResponse(getWalletEntity(userId));
    }


    public Wallet getWalletEntity(String userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + userId));
    }

    private WalletResponse toResponse(Wallet wallet) {
        return WalletResponse.builder()
                .walletId(wallet.getWalletId())
                .userId(wallet.getUserId())
                .totalBalance(wallet.getTotalBalance())
                .lockedBalance(wallet.getLockedBalance())
                .availableBalance(wallet.getAvailableBalance())
                .build();
    }
}
