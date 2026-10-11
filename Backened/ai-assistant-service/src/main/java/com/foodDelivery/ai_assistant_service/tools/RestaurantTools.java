package com.foodDelivery.ai_assistant_service.tools;

import com.foodDelivery.ai_assistant_service.client.FoodRushClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class RestaurantTools {

    private final FoodRushClient client;
    private final ToolCallTracker tracker;

    @Tool(description = """
        Search restaurants by keyword (cuisine, name, dish).
        Returns up to 5 matching restaurants with id, name, cuisine,
        rating, and whether they're currently open.
        """)
    public Object searchRestaurants(
            @ToolParam(description = "The search keyword e.g. 'pizza', 'biryani', 'Domino'") String keyword) {
        tracker.record("searchRestaurants");
        if (keyword == null || keyword.isBlank()) return "I need a keyword to search.";

        List<Map<String, Object>> results = client.getList(
                "/api/v1/restaurants/search?keyword=" + keyword.replace(" ", "%20"));
        if (results == null || results.isEmpty()) {
            return "No restaurants found matching '" + keyword + "'.";
        }
        return results.stream().limit(5).map(this::projection).toList();
    }

    @Tool(description = """
        Find restaurants near a given latitude/longitude. Useful when the
        user asks 'what's near me' (you must already know their location)
        or 'restaurants near <area>'. Radius defaults to 5 km.
        """)
    public Object getNearbyRestaurants(
            @ToolParam(description = "Latitude in decimal degrees") Double lat,
            @ToolParam(description = "Longitude in decimal degrees") Double lng,
            @ToolParam(description = "Radius in km, default 5", required = false) Double radius) {
        tracker.record("getNearbyRestaurants");
        if (lat == null || lng == null) return "I need both latitude and longitude.";
        double r = (radius == null || radius <= 0) ? 5.0 : radius;

        List<Map<String, Object>> results = client.getList(
                "/api/v1/restaurants/nearby?lat=" + lat + "&lng=" + lng + "&radius=" + r);
        if (results == null || results.isEmpty()) {
            return "No restaurants within " + r + " km.";
        }
        return results.stream().limit(5).map(this::projection).toList();
    }

    @Tool(description = """
        Check if a specific restaurant is open right now.
        Returns the restaurant name, current open/closed status, and its
        opening / closing times. Use when the user asks 'is X open today',
        'are they open right now', etc.
        """)
    public Object isRestaurantOpen(
            @ToolParam(description = "The restaurant id (UUID)") String restaurantId) {
        tracker.record("isRestaurantOpen");
        if (restaurantId == null || restaurantId.isBlank()) return "I need a restaurantId.";

        Map<String, Object> r = client.getMap("/api/v1/restaurants/" + restaurantId);
        if (r == null) return "Restaurant " + restaurantId + " not found.";

        boolean flagOpen = Boolean.TRUE.equals(r.get("isOpen"));
        boolean withinHours = isWithinHours(
                String.valueOf(r.get("openingTime")),
                String.valueOf(r.get("closingTime"))
        );

        return Map.of(
                "name",          r.getOrDefault("name", ""),
                "isOpen",        flagOpen && withinHours,
                "ownerToggle",   flagOpen,
                "openingTime",   r.getOrDefault("openingTime", "unknown"),
                "closingTime",   r.getOrDefault("closingTime", "unknown"),
                "currentlyWithinHours", withinHours
        );
    }

    @Tool(description = """
        Get the top-rated restaurants on the platform. Use for 'show me
        the best restaurants', 'top picks', 'recommendations'.
        """)
    public Object getTopRatedRestaurants() {
        tracker.record("getTopRatedRestaurants");
        List<Map<String, Object>> results = client.getList("/api/v1/restaurants/top-rated");
        if (results == null || results.isEmpty()) return "No top-rated restaurants yet.";
        return results.stream().limit(5).map(this::projection).toList();
    }

    @Tool(description = """
        Get full details and the menu of a single restaurant by id.
        Use when the user asks 'what's on the menu at X', 'show me the menu',
        or 'how much is <item> at <restaurant>'.
        """)
    public Object getRestaurantDetails(
            @ToolParam(description = "The restaurant id (UUID)") String restaurantId) {
        tracker.record("getRestaurantDetails");
        if (restaurantId == null || restaurantId.isBlank()) return "I need a restaurantId.";

        Map<String, Object> r = client.getMap("/api/v1/restaurants/" + restaurantId);
        if (r == null) return "Restaurant not found.";

        // Trim menu to essentials so we don't blow the LLM context
        Object menu = r.get("menuItems");
        if (menu instanceof List<?> items && !items.isEmpty()) {
            List<Map<String, Object>> trimmed = items.stream()
                    .filter(Map.class::isInstance)
                    .map(i -> (Map<String, Object>) i)
                    .limit(20)
                    .map(i -> Map.of(
                            "menuItemId", i.getOrDefault("menuItemId", ""),
                            "name",       i.getOrDefault("name", ""),
                            "price",      i.getOrDefault("price", 0),
                            "available",  i.getOrDefault("available", true)
                    ))
                    .toList();
            return Map.of(
                    "restaurantId", r.get("restaurantId"),
                    "name",         r.get("name"),
                    "cuisine",      r.get("cuisineType"),
                    "menu",         trimmed
            );
        }
        return projection(r);
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private Map<String, Object> projection(Map<String, Object> r) {
        return Map.of(
                "restaurantId", r.getOrDefault("restaurantId", ""),
                "name",         r.getOrDefault("name", ""),
                "cuisine",      r.getOrDefault("cuisineType", ""),
                "rating",       r.getOrDefault("avgRating", 0),
                "isOpen",       r.getOrDefault("isOpen", false),
                "deliveryMins", r.getOrDefault("avgDeliveryTimeMins", 0)
        );
    }

    private boolean isWithinHours(String open, String close) {
        if (open == null || close == null || "null".equals(open) || "null".equals(close)) {
            return true; // assume always open if hours not configured
        }
        try {
            LocalTime now = LocalTime.now();
            LocalTime o = LocalTime.parse(open);
            LocalTime c = LocalTime.parse(close);
            // handle overnight (e.g. 18:00 → 02:00)
            if (c.isBefore(o)) {
                return now.isAfter(o) || now.isBefore(c);
            }
            return now.isAfter(o) && now.isBefore(c);
        } catch (Exception e) {
            return true;
        }
    }
}
