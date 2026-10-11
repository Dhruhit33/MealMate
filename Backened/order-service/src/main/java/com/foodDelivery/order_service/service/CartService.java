package com.foodDelivery.order_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodDelivery.order_service.dto.CartItemRequest;
import com.foodDelivery.order_service.dto.CartItemResponse;
import com.foodDelivery.order_service.dto.CartResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CART_PREFIX = "cart:";
    private static final String CART_META_PREFIX = "cart-meta:";
    private static final long CART_TTL_HOURS = 24;
    private static final BigDecimal DEFAULT_DELIVERY_FEE = new BigDecimal("30.00");

    // ─── Add Item to Cart ──────────────────────────────────────────────

    public CartResponse addItem(String userId, CartItemRequest request) {
        String cartKey = CART_PREFIX + userId;
        String metaKey = CART_META_PREFIX + userId;

        // Check if cart has items from a different restaurant
        String existingRestaurant = redisTemplate.opsForValue().get(metaKey);
        if (existingRestaurant != null && !existingRestaurant.equals(request.getRestaurantId())) {
            throw new RuntimeException(
                    "Cart has items from another restaurant. Clear cart first or remove existing items.");
        }

        // Build cart item
        CartItemResponse item = CartItemResponse.builder()
                .menuItemId(request.getMenuItemId())
                .menuItemName(request.getMenuItemName())
                .unitPrice(request.getUnitPrice())
                .quantity(request.getQuantity())
                .totalPrice(request.getUnitPrice().multiply(BigDecimal.valueOf(request.getQuantity())))
                .restaurantId(request.getRestaurantId())
                .restaurantName(request.getRestaurantName())
                .build();

        // Store in Redis hash: cart:userId -> { itemId: itemJson }
        try {
            String itemJson = objectMapper.writeValueAsString(item);
            redisTemplate.opsForHash().put(cartKey, request.getMenuItemId(), itemJson);
            redisTemplate.expire(cartKey, CART_TTL_HOURS, TimeUnit.HOURS);

            // Store restaurant metadata
            redisTemplate.opsForValue().set(metaKey, request.getRestaurantId(), CART_TTL_HOURS, TimeUnit.HOURS);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize cart item", e);
        }

        log.info("Added item {} to cart for user {}", request.getMenuItemName(), userId);
        return getCart(userId);
    }

    // ─── Update Item Quantity ──────────────────────────────────────────

    public CartResponse updateQuantity(String userId, String menuItemId, int quantity) {
        String cartKey = CART_PREFIX + userId;

        if (quantity <= 0) {
            return removeItem(userId, menuItemId);
        }

        String itemJson = (String) redisTemplate.opsForHash().get(cartKey, menuItemId);
        if (itemJson == null) {
            throw new RuntimeException("Item not found in cart");
        }

        try {
            CartItemResponse item = objectMapper.readValue(itemJson, CartItemResponse.class);
            item.setQuantity(quantity);
            item.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(quantity)));

            redisTemplate.opsForHash().put(cartKey, menuItemId, objectMapper.writeValueAsString(item));
            redisTemplate.expire(cartKey, CART_TTL_HOURS, TimeUnit.HOURS);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to process cart item", e);
        }

        return getCart(userId);
    }

    // ─── Remove Item from Cart ─────────────────────────────────────────

    public CartResponse removeItem(String userId, String menuItemId) {
        String cartKey = CART_PREFIX + userId;
        redisTemplate.opsForHash().delete(cartKey, menuItemId);

        // If cart is now empty, clean up metadata
        if (redisTemplate.opsForHash().size(cartKey) == 0) {
            redisTemplate.delete(CART_META_PREFIX + userId);
        }

        return getCart(userId);
    }

    // ─── Get Cart ──────────────────────────────────────────────────────

    public CartResponse getCart(String userId) {
        String cartKey = CART_PREFIX + userId;
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(cartKey);

        if (entries.isEmpty()) {
            return CartResponse.builder()
                    .userId(userId)
                    .item(Collections.emptyList())
                    .subTotal(BigDecimal.ZERO)
                    .deliveryFee(BigDecimal.ZERO)
                    .total(BigDecimal.ZERO)
                    .itemCount(0)
                    .build();
        }

        List<CartItemResponse> items = new ArrayList<>();
        String restaurantId = null;
        String restaurantName = null;

        for (Object value : entries.values()) {
            try {
                CartItemResponse item = objectMapper.readValue((String) value, CartItemResponse.class);
                items.add(item);
                if (restaurantId == null) {
                    restaurantId = item.getRestaurantId();
                    restaurantName = item.getRestaurantName();
                }
            } catch (JsonProcessingException e) {
                log.error("Failed to deserialize cart item", e);
            }
        }

        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int itemCount = items.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        return CartResponse.builder()
                .userId(userId)
                .restaurantId(restaurantId)
                .restaurantName(restaurantName)
                .item(items)
                .subTotal(subtotal)
                .deliveryFee(DEFAULT_DELIVERY_FEE)
                .total(subtotal.add(DEFAULT_DELIVERY_FEE))
                .itemCount(itemCount)
                .build();
    }

    // ─── Clear Cart ────────────────────────────────────────────────────

    public void clearCart(String userId) {
        redisTemplate.delete(CART_PREFIX + userId);
        redisTemplate.delete(CART_META_PREFIX + userId);
        log.info("Cart cleared for user {}", userId);
    }
}
