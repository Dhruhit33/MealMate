package com.foodDelivery.payment_service.exception;

public class DuplicateLockException extends RuntimeException {
    public DuplicateLockException(String message ){
        super(message);
    }
}
