package com.foodDelivery.restaurant_service.service;

import com.foodDelivery.restaurant_service.domain.Restaurant;
import com.foodDelivery.restaurant_service.dto.RestaurantRequest;
import com.foodDelivery.restaurant_service.dto.RestaurantResponse;
import com.foodDelivery.restaurant_service.repository.RestaurantRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    //create Res

    public RestaurantResponse createRestaurant(String ownerId , RestaurantRequest restaurantRequest){
        Restaurant restaurant = Restaurant.builder()
                .ownerId(ownerId)
                .name(restaurantRequest.getName())
                .description(restaurantRequest.getDescription())
                .cuisineType(restaurantRequest.getCuisineType())
                .address(restaurantRequest.getAddress())
                .latitude(restaurantRequest.getLatitude())
                .longitude(restaurantRequest.getLongitude())
                .minOrderAmount(restaurantRequest.getMinOrderAmount())
                .openingTime(restaurantRequest.getOpeningTime())
                .closingTime(restaurantRequest.getClosingTime())
                .imageUrl(restaurantRequest.getImageUrl())
                .phone(restaurantRequest.getPhone())
                .build();

        restaurant =restaurantRepository.save(restaurant);
        return  RestaurantResponse.fromEntity(restaurant);
    }

    //--------update Restaurant -----//
    @Transactional
    public RestaurantResponse updateRestaurant(String restaurantId , String ownerId , RestaurantRequest request){
        Restaurant restaurant = getRestaurantEntity(restaurantId);
        validateOwner(restaurant, ownerId);

        if (request.getName() !=null) restaurant.setName(request.getName());
        if (request.getDescription()!=null) restaurant.setDescription(request.getDescription());
        if (request.getCuisineType()!=null) restaurant.setCuisineType(request.getCuisineType());
        if (request.getAddress()!=null) restaurant.setAddress(request.getAddress());
        if (request.getLatitude()!=null) restaurant.setLatitude(request.getLatitude());
        if (request.getLongitude()!=null) restaurant.setLongitude(request.getLongitude());
        if (request.getMinOrderAmount() != null) restaurant.setMinOrderAmount(request.getMinOrderAmount());
        if (request.getOpeningTime() != null) restaurant.setOpeningTime(request.getOpeningTime());
        if (request.getClosingTime() != null) restaurant.setClosingTime(request.getClosingTime());
        if (request.getImageUrl() != null) restaurant.setImageUrl(request.getImageUrl());
        if (request.getPhone() != null) restaurant.setPhone(request.getPhone());

        restaurant=restaurantRepository.save(restaurant);
        return RestaurantResponse.fromEntity(restaurant);


    }

    //--------get by id ---------//
    public RestaurantResponse getRestaurant(String restaurantId) {
        return RestaurantResponse.fromEntity(getRestaurantEntity(restaurantId));
    }

    // get my restaurant for owner

    public List<RestaurantResponse> getMyRestaurant(String ownerId ){
        return restaurantRepository.findByOwnerId(ownerId).stream()
                .map(RestaurantResponse::fromEntity)
                .toList();
    }

    // Search for restaurants with optional 25km radius filtering
    public List<RestaurantResponse> search(String keyword, Double lat, Double lng, double radiusKm) {
        String key = (keyword != null) ? keyword.trim() : "";
        if (lat != null && lng != null) {
            List<Object[]> result = restaurantRepository.searchNearbyRestaurants(lat, lng, radiusKm, key);
            return mapQueryResultToResponses(result);
        }
        return restaurantRepository.searchByKeyword(key).stream()
                .map(RestaurantResponse::fromEntity)
                .toList();
    }

    // Backward compatible search overload
    public List<RestaurantResponse> search(String keyword) {
        return search(keyword, null, null, 25.0);
    }

    @Transactional
    public RestaurantResponse toggleOpen(String restaurantId , String ownerId ){
        Restaurant restaurant= getRestaurantEntity(restaurantId);
        validateOwner(restaurant, ownerId);

        restaurant.setIsOpen(!restaurant.getIsOpen());
        restaurant=restaurantRepository.save(restaurant);
        return RestaurantResponse.fromEntity(restaurant);
    }

    // Nearby restaurants within radiusKm
    public List<RestaurantResponse> findNearBy(double lat, double lng, double radiusKm, String cuisine) {
        List<Object[]> result;

        if (cuisine != null && !cuisine.isBlank()) {
            result = restaurantRepository.findNearbyByCuisine(lat, lng, radiusKm, cuisine);
        } else {
            result = restaurantRepository.findNearbyRestaurants(lat, lng, radiusKm);
        }
        return mapQueryResultToResponses(result);
    }

    // Top-rated restaurants with optional 25km radius filtering
    public List<RestaurantResponse> getTopRated(Double lat, Double lng, double radiusKm) {
        if (lat != null && lng != null) {
            List<Object[]> result = restaurantRepository.findNearbyTopRated(lat, lng, radiusKm);
            return mapQueryResultToResponses(result).stream().limit(20).toList();
        }
        return restaurantRepository.findTopRated().stream()
                .limit(20)
                .map(RestaurantResponse::fromEntity)
                .toList();
    }

    public List<RestaurantResponse> getTopRated() {
        return getTopRated(null, null, 25.0);
    }

    private List<RestaurantResponse> mapQueryResultToResponses(List<Object[]> result) {
        return result.stream().map(row -> {
            // Native query returns all columns + distance_km as last column
            Restaurant r = restaurantRepository.findById((String) row[0]).orElse(null);
            if (r == null) return null;
            RestaurantResponse response = RestaurantResponse.fromEntity(r);
            // Last column is the calculated distance
            Object distObj = row[row.length - 1];
            if (distObj instanceof Number num) {
                response.setDistanceKm(Math.round(num.doubleValue() * 100.0) / 100.0);
            }
            return response;
        }).filter(Objects::nonNull).toList();
    }

    //delete Restaurant

    @Transactional
    public void deleteRestaurant(String restaurantId , String ownerId){
        Restaurant restaurant =getRestaurantEntity(restaurantId);
        validateOwner(restaurant, ownerId);
        restaurantRepository.delete(restaurant);
    }


    // internal helper //

    public Restaurant getRestaurantEntity(String Id){
        return restaurantRepository.findById(Id)
                .orElseThrow(()->new RuntimeException("Restaurant not found:" + Id));

    }
    ///  Here we are validate the owner with his I'd
    ///
    public void validateOwner(Restaurant restaurant , String ownerId){
        if (!restaurant.getOwnerId().equals(ownerId)){
            throw new RuntimeException("You don't own this restaurant");

        }

    }


}

