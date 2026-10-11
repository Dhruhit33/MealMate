package com.foodDelivery.restaurant_service.controller;

import com.foodDelivery.restaurant_service.domain.Review;
import com.foodDelivery.restaurant_service.dto.ReviewRequest;
import com.foodDelivery.restaurant_service.service.JwtService;
import com.foodDelivery.restaurant_service.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/restaurants/{restaurantId}/reviews")
@RequiredArgsConstructor


public class ReviewController {

    private final ReviewService reviewService;
    private final JwtService jwtService;

    //get review for thew restaurant

    @GetMapping
    public ResponseEntity<List<Review>> getReview(@PathVariable String restaurantId ){
        return ResponseEntity.ok(reviewService.getReviews(restaurantId));
    }
    @PostMapping
    public ResponseEntity<Review> addReview(
            @PathVariable String restaurantId,
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody ReviewRequest request) {

        String userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.addReview(restaurantId, userId, request));
    }

    // ─── Delete Review (only reviewer) ─────────────────────────────────

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<String> deleteReview(
            @PathVariable String restaurantId,
            @PathVariable String reviewId,
            @RequestHeader("Authorization") String token) {

        String userId = jwtService.extractUserId(token.replace("Bearer ", ""));
        reviewService.deleteReview(reviewId, userId);
        return ResponseEntity.ok("Review deleted");
    }
}
