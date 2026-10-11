package com.foodDelivery.delivery_service.service;

import com.foodDelivery.delivery_service.domain.Driver;
import com.foodDelivery.delivery_service.domain.DriverStatus;
import com.foodDelivery.delivery_service.repository.DriverRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class DriverMatchingService {

    private final RedisTemplate<String, String> redisTemplate;
    private final DriverRepo driverRepository;
    private static final String DRIVER_LOCATIONS_KEY = "driver-locations";
    @Value("${delivery.matching.radius-km:5.0}")
    private double matchingRadiusKm;
    @Value("${delivery.matching.max-drivers:10}")
    private int maxDrivers;
    @Value("${delivery.matching.retry-radius-km:10.0}")
    private double retryRadiusKm;
    //update driver location after 3 sec
    public void updateDriverLocation(String driverId, double latitude, double longitude) {
        redisTemplate.opsForGeo().add(
                DRIVER_LOCATIONS_KEY,
                new Point(longitude, latitude), // Redis GEO uses (lng, lat)
                driverId
        );
        log.debug("Updated driver location: driverId={}, lat={}, lng={}", driverId, latitude, longitude);
    }

    //when goes offline remove driver location
    public void removeDriverLocation(String driverId) {
        redisTemplate.opsForGeo().remove(DRIVER_LOCATIONS_KEY, driverId);
        log.info("Removed driver location: driverId={}", driverId);
    }
    /**
     * Find the nearest available driver to a restaurant.
     * Uses Redis GEO RADIUS — O(log N) nearest-driver queries.
     * Algorithm:
     * 1. Query Redis GEO for all drivers within radius of restaurant
     * 2. Sort by distance ascending
     * 3. Filter: must be ONLINE status (not already on delivery)
     * 4. Return first match
     * 5. If no match, retry with wider radius
     */
    public Optional<Driver> findNearestDriver(double restaurantLat, double restaurantLng) {
        // First attempt: search within configured radius
        Optional<Driver> driver = searchInRadius(restaurantLat, restaurantLng, matchingRadiusKm);

        if (driver.isPresent()) {
            return driver;
        }

        // Second attempt: wider radius
        log.info("No driver found within {}km, retrying with {}km radius", matchingRadiusKm, retryRadiusKm);
        Optional<Driver> retryDriver = searchInRadius(restaurantLat, restaurantLng, retryRadiusKm);
        
        if (retryDriver.isPresent()) {
            return retryDriver;
        }
        
        // Third attempt: For testing environment, if no driver nearby, just assign ANY online driver
        log.info("No driver within retry radius. Falling back to DB to find ANY online driver (testing mode)");
        return fallbackToDatabase();
    }

    private Optional<Driver> searchInRadius(double lat, double lng, double radiusKm) {
        try {
            GeoResults<RedisGeoCommands.GeoLocation<String>> nearby =
                    redisTemplate.opsForGeo().radius(
                            DRIVER_LOCATIONS_KEY,
                            new Circle(
                                    new Point(lng, lat), // Redis GEO uses (lng, lat)
                                    new Distance(radiusKm, Metrics.KILOMETERS)
                            ),
                            RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
                                    .sortAscending()
                                    .limit(maxDrivers)
                    );

            if (nearby == null || nearby.getContent().isEmpty()) {
                log.info("No drivers found within {}km of ({}, {})", radiusKm, lat, lng);
                return Optional.empty();
            }

            // Filter: must be ONLINE and not already on a delivery
            for (GeoResult<RedisGeoCommands.GeoLocation<String>> result : nearby) {
                String driverId = result.getContent().getName();
                double distanceKm = result.getDistance().getValue();
                Optional<Driver> driverOpt = driverRepository.findById(driverId);
                if (driverOpt.isPresent()) {
                    Driver driver = driverOpt.get();
                    if (driver.getStatus() == DriverStatus.ONLINE) {
                        log.info("Matched driver: driverId={}, name={}, distance={}km",
                                driverId, driver.getName(), String.format("%.2f", distanceKm));
                        return Optional.of(driver);
                    } else {
                        log.debug("Skipping driver {} — status is {}", driverId, driver.getStatus());
                    }
                }
            }

            log.info("All {} nearby drivers are busy", nearby.getContent().size());
            return Optional.empty();
        } catch (Exception e) {
            log.error("Redis GEO query failed, falling back to DB query: {}", e.getMessage());
            return fallbackToDatabase();
        }
    }

    /**
     * Fallback: if Redis is down, find any ONLINE driver from MySQL.
     * Degraded but functional (as per HLD failure scenario).
     */
    private Optional<Driver> fallbackToDatabase() {
        log.warn("Using database fallback for driver matching");
        return driverRepository.findByStatus(DriverStatus.ONLINE)
                .stream()
                .findFirst();
    }

    /**
     * Get driver's current location from Redis GEO.
     */
    public Point getDriverLocation(String driverId) {
        try {
            var positions = redisTemplate.opsForGeo().position(DRIVER_LOCATIONS_KEY, driverId);
            if (positions != null && !positions.isEmpty() && positions.get(0) != null) {
                Point point = positions.get(0);
                // Redis returns (lng, lat), we return as-is — consumers must handle order
                return point;
            }
        } catch (Exception e) {
            log.error("Failed to get driver location from Redis: {}", e.getMessage());
        }
        return null;
    }
}





