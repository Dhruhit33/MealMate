package com.foodDelivery.delivery_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@Slf4j
public class ETAService {

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double AVG_SPEED_KMH = 25.0;  // Average delivery speed in city
    private static final int RESTAURANT_PREP_BUFFER_MINS = 5; // Buffer for food handover

    //calculate dis between two point using Haversine formula


    public double calculateDistanceKm(double lat1 , double lng1 , double lat2 , double lng2){
        double dLat = Math.toRadians(lat2-lat1);
        double dLng =Math.toRadians(lng2 - lng1);


        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    //calculate eta from driver + restaurant + customer
    //return estimate mins

    public  int calculateETA(double driverLat, double driverLng,
                             double restaurantLat, double restaurantLng,
                             double customerLat, double customerLng){

        // distance : driver -> res

        double driverToRes =calculateDistanceKm(driverLat , driverLng,restaurantLat,restaurantLng);

        //dis res-> customer
        double resToCustomer = calculateDistanceKm(restaurantLat , restaurantLng , customerLat, customerLng);

        double total= driverToRes + resToCustomer;
        // Time = distance / speed (in hours), convert to minutes
        int travelMins = (int) Math.ceil((total / AVG_SPEED_KMH) * 60);

        int totalETA = travelMins + RESTAURANT_PREP_BUFFER_MINS;

        log.info("ETA calculation: driverToRestaurant={}km, restaurantToCustomer={}km, totalETA={}mins",
                String.format("%.2f", driverToRes), String.format("%.2f", resToCustomer), totalETA);

        return Math.max(totalETA, 10); // Minimum 10 mins ETA


    }

    // calculate ETA from current driver position to customer (After pickup )

    public  int calculateETAfromDriver(double driverLat , double driverLng
                                         , double customerLat , double customerLng){
        double dis = calculateDistanceKm(driverLat, driverLng,customerLat,customerLng);
        int travelMins = (int)Math.ceil((dis/AVG_SPEED_KMH) * 60);
        return Math.max(travelMins,5);


    }

    //convert bigDecimal to decimal 2 digit

    public BigDecimal totalDisBigDecimal(double distanceKm ){
        return BigDecimal.valueOf(distanceKm).setScale(2, RoundingMode.HALF_UP);
    }
}
