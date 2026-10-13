package com.foodDelivery.delivery_service.service;

import com.foodDelivery.delivery_service.domain.Driver;
import com.foodDelivery.delivery_service.domain.DriverStatus;
import com.foodDelivery.delivery_service.repository.DriverRepo;
import com.foodDelivery.delivery_service.repository.DeliveryRepo;
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
    private final DeliveryRepo deliveryRepo;
    private static final String DRIVER_LOCATIONS_KEY = "driver-locations";
    @Value("${delivery.matching.radius-km:25.0}")
    private double matchingRadiusKm;
    @Value("${delivery.matching.max-drivers:15}")
    private int maxDrivers;

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
     * Find the nearest available driver within 25.0 km of the restaurant.
     * Uses Redis GEO RADIUS — O(log N) nearest-driver queries.
     * Algorithm:
     * 1. Query Redis GEO for all drivers within 25 km of restaurant
     * 2. Sort by distance ascending
     * 3. Filter: must be ONLINE status (not already on delivery)
     * 4. Return first match
     * 5. If no match in Redis, fallback to DB checking coordinates <= 25 km
     */
    public Optional<Driver> findNearestDriver(double restaurantLat, double restaurantLng) {
        // Query Redis GEO for drivers within 25.0 km
        Optional<Driver> driver = searchInRadius(restaurantLat, restaurantLng, matchingRadiusKm);

        if (driver.isPresent()) {
            return driver;
        }

        // Fallback: Check MySQL database strictly within 25.0 km radius
        log.info("No driver found in Redis within {}km of ({}, {}). Checking database within {}km",
                matchingRadiusKm, restaurantLat, restaurantLng, matchingRadiusKm);
        return fallbackToDatabase(restaurantLat, restaurantLng, matchingRadiusKm);
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

            // Filter: must not be OFFLINE and not currently on an active delivery
            for (GeoResult<RedisGeoCommands.GeoLocation<String>> result : nearby) {
                String driverId = result.getContent().getName();
                double distanceKm = result.getDistance().getValue();
                Optional<Driver> driverOpt = driverRepository.findById(driverId);
                if (driverOpt.isPresent()) {
                    Driver driver = driverOpt.get();
                    boolean hasActive = deliveryRepo.findActiveDeliveryByDriverId(driverId).isPresent();
                    if (!hasActive && driver.getStatus() != DriverStatus.OFFLINE) {
                        log.info("Matched driver: driverId={}, name={}, distance={}km",
                                driverId, driver.getName(), String.format("%.2f", distanceKm));
                        return Optional.of(driver);
                    } else {
                        log.debug("Skipping driver {} — status is {}, hasActive={}", driverId, driver.getStatus(), hasActive);
                    }
                }
            }

            log.info("All {} nearby drivers are busy", nearby.getContent().size());
            return Optional.empty();
        } catch (Exception e) {
            log.error("Redis GEO query failed, falling back to DB query: {}", e.getMessage());
            return fallbackToDatabase(lat, lng, radiusKm);
        }
    }

    /**
     * Fallback: query MySQL database strictly within maxRadiusKm (25 km).
     * Calculates Haversine distance from the restaurant and picks the closest available driver.
     */
    private Optional<Driver> fallbackToDatabase(double resLat, double resLng, double maxRadiusKm) {
        log.warn("Using database query for driver matching near ({}, {}) within {}km", resLat, resLng, maxRadiusKm);
        return driverRepository.findAll()
                .stream()
                .filter(d -> d.getStatus() != DriverStatus.OFFLINE)
                .filter(d -> deliveryRepo.findActiveDeliveryByDriverId(d.getDriverId()).isEmpty())
                .filter(d -> {
                    if (d.getCurrentLatitude() == null || d.getCurrentLongitude() == null) {
                        return false;
                    }
                    double dist = calculateHaversineKm(
                            resLat, resLng,
                            d.getCurrentLatitude().doubleValue(),
                            d.getCurrentLongitude().doubleValue()
                    );
                    return dist <= maxRadiusKm;
                })
                .min(java.util.Comparator.comparingDouble(d -> calculateHaversineKm(
                        resLat, resLng,
                        d.getCurrentLatitude().doubleValue(),
                        d.getCurrentLongitude().doubleValue()
                )));
    }

    public static double calculateHaversineKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 100.0) / 100.0;
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

    /**
     * Find all online drivers in queue order (sorted by distance ascending from restaurant).
     */
    public java.util.List<Driver> findDriversInQueue(double restaurantLat, double restaurantLng, double radiusKm) {
        return driverRepository.findAll()
                .stream()
                .filter(d -> d.getStatus() != DriverStatus.OFFLINE)
                .filter(d -> {
                    if (d.getCurrentLatitude() == null || d.getCurrentLongitude() == null) {
                        return false;
                    }
                    double dist = calculateHaversineKm(
                            restaurantLat, restaurantLng,
                            d.getCurrentLatitude().doubleValue(),
                            d.getCurrentLongitude().doubleValue()
                    );
                    return dist <= radiusKm;
                })
                .sorted(java.util.Comparator.comparingDouble(d -> calculateHaversineKm(
                        restaurantLat, restaurantLng,
                        d.getCurrentLatitude().doubleValue(),
                        d.getCurrentLongitude().doubleValue()
                )))
                .toList();
    }
}





