package com.foodDelivery.restaurant_service.service;

import com.foodDelivery.restaurant_service.domain.Restaurant;
import com.foodDelivery.restaurant_service.domain.Review;
import com.foodDelivery.restaurant_service.dto.ReviewRequest;
import com.foodDelivery.restaurant_service.repository.RestaurantRepository;
import com.foodDelivery.restaurant_service.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantService restaurantService;

    // ─── Add or Update Review ──────────────────────────────────────────

    @Transactional
    public Review addReview(String restaurantId, String userId, ReviewRequest request) {
        Restaurant restaurant = restaurantService.getRestaurantEntity(restaurantId);

        // Check if user already reviewed — update if so
        Review review = reviewRepository.findByRestaurantRestaurantIdAndUserId(restaurantId, userId)
                .map(existing -> {
                    existing.setRating(request.getRating());
                    existing.setComment(request.getComment());
                    if (request.getUserName() != null) existing.setUserName(request.getUserName());
                    return existing;
                })
                .orElseGet(() -> Review.builder()
                        .restaurant(restaurant)
                        .userId(userId)
                        .rating(request.getRating())
                        .comment(request.getComment())
                        .userName(request.getUserName())
                        .build()
                );

        review = reviewRepository.save(review);

        // Recalculate average rating for the restaurant
        recalculateRating(restaurantId);

        return review;
    }

    // ─── Get All Reviews for a Restaurant ──────────────────────────────

    public List<Review> getReviews(String restaurantId) {
        return reviewRepository.findByRestaurantRestaurantIdOrderByCreatedAtDesc(restaurantId);
    }

    // ─── Delete Review (only the reviewer can delete) ──────────────────

    @Transactional
    public void deleteReview(String reviewId, String userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own reviews");
        }

        String restaurantId = review.getRestaurant().getRestaurantId();
        reviewRepository.delete(review);

        // Recalculate after deletion
        recalculateRating(restaurantId);
    }

    // ─── Recalculate Average Rating ────────────────────────────────────

    private void recalculateRating(String restaurantId) {
        Double avg = reviewRepository.calculateAverageRating(restaurantId);
        Integer count = reviewRepository.countByRestaurantId(restaurantId);

        Restaurant restaurant = restaurantService.getRestaurantEntity(restaurantId);
        restaurant.setAvgRating(avg != null
                ? BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO);
        restaurant.setTotalReviews(count != null ? count : 0);
        restaurantRepository.save(restaurant);
    }
}
