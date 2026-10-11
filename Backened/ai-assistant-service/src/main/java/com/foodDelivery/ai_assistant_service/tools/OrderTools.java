package com.foodDelivery.ai_assistant_service.tools;

import com.foodDelivery.ai_assistant_service.client.FoodRushClient;
import com.foodDelivery.ai_assistant_service.config.RequestContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Tools the LLM can invoke for anything related to a user's orders.
 * Each method MUST be safe to call concurrently and MUST gracefully
 * handle a missing/invalid auth context (returns an explanatory string).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderTools {

    private final FoodRushClient client;
    private final RequestContext ctx;
    private final ToolCallTracker tracker;

    // ─── List orders ───────────────────────────────────────────────

    @Tool(description = """
        Get a list of the current user's recent orders, including status,
        restaurant name, total amount, and order id. Use this when the user
        asks 'what are my orders', 'show my recent orders', or anything
        that requires listing orders without a specific id.
        """)
    public Object getMyOrders() {
        tracker.record("getMyOrders");
        if (ctx.getUserId() == null) return "User is not logged in.";

        List<Map<String, Object>> orders = client.getList("/api/v1/orders/my");
        if (orders == null || orders.isEmpty()) {
            return "You have no orders yet.";
        }

        // Trim to last 5 and pick the fields that matter
        return orders.stream().limit(5).map(o -> Map.of(
                "orderId",        o.getOrDefault("orderId", ""),
                "status",         o.getOrDefault("status", ""),
                "restaurantName", o.getOrDefault("restaurantName", ""),
                "totalAmount",    o.getOrDefault("totalAmount", 0),
                "createdAt",      o.getOrDefault("createdAt", "")
        )).toList();
    }

    // ─── Single order status ───────────────────────────────────────

    @Tool(description = """
        Get the current status and full details of a single order by its id.
        Use this when the user asks 'where is my order', 'what is the status
        of order ABC', or refers to a specific orderId.
        """)
    public Object getOrderStatus(
            @ToolParam(description = "The order id, typically a UUID") String orderId) {
        tracker.record("getOrderStatus");
        if (orderId == null || orderId.isBlank()) return "I need an orderId to look up.";
        if (ctx.getUserId() == null) return "User is not logged in.";

        Map<String, Object> order = client.getMap("/api/v1/orders/" + orderId);
        if (order == null) return "Order " + orderId + " not found or not accessible.";

        // Best-effort delivery status if order is in transit
        String status = String.valueOf(order.getOrDefault("status", ""));
        Map<String, Object> result = new java.util.HashMap<>(order);
        if (List.of("PICKED_UP", "READY", "PREPARING").contains(status)) {
            Map<String, Object> delivery = client.getMap("/api/v1/delivery/" + orderId + "/status");
            if (delivery != null) {
                result.put("delivery", delivery);
            }
        }
        return result;
    }

    // ─── Cancel order ──────────────────────────────────────────────

    @Tool(description = """
        Cancel a pending order. Only works for orders in CREATED or
        CONFIRMED state. Always confirms with the user before calling
        this tool — the user must explicitly say 'yes, cancel it' or
        similar before this is invoked.
        """)
    public Object cancelOrder(
            @ToolParam(description = "The order id to cancel") String orderId,
            @ToolParam(description = "Optional reason for cancellation") String reason) {
        tracker.record("cancelOrder");
        if (orderId == null || orderId.isBlank()) return "I need an orderId to cancel.";
        if (ctx.getUserId() == null) return "User is not logged in.";

        String path = "/api/v1/orders/" + orderId + "/cancel"
                + (reason == null || reason.isBlank() ? "" : "?reason=" + reason.replace(" ", "%20"));

        Map<String, Object> response = client.postMap(path, null);
        return response == null ? Map.of("error", "Cancel failed") : response;
    }

    // ─── Track delivery ────────────────────────────────────────────

    @Tool(description = """
        Get live delivery / driver tracking info for an order — driver name,
        current location if available, ETA, and delivery status.
        Use this for 'where is my driver', 'how far is the delivery', etc.
        """)
    public Object trackDelivery(
            @ToolParam(description = "The order id whose delivery to track") String orderId) {
        tracker.record("trackDelivery");
        if (orderId == null || orderId.isBlank()) return "I need an orderId.";
        if (ctx.getUserId() == null) return "User is not logged in.";

        Map<String, Object> delivery = client.getMap("/api/v1/delivery/" + orderId + "/status");
        if (delivery == null) {
            return "No delivery has been assigned for order " + orderId + " yet.";
        }
        return delivery;
    }
}
