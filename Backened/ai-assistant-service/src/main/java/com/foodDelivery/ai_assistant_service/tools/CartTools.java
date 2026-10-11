package com.foodDelivery.ai_assistant_service.tools;

import com.foodDelivery.ai_assistant_service.client.FoodRushClient;
import com.foodDelivery.ai_assistant_service.config.RequestContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class CartTools {

    private final FoodRushClient client;
    private final RequestContext ctx;
    private final ToolCallTracker tracker;

    // ─── Get current cart ──────────────────────────────────────────

    @Tool(description = """
        Get the current contents of the user's cart — items, quantities,
        unit prices, subtotal, delivery fee, and total. Use to answer
        'what's in my cart' or to confirm before placing an order.
        """)
    public Object getCart() {
        tracker.record("getCart");
        if (ctx.getUserId() == null) return "User is not logged in.";

        Map<String, Object> cart = client.getMap("/api/v1/cart");
        if (cart == null) return "Your cart is empty.";
        return cart;
    }

    // ─── Add an item to cart ───────────────────────────────────────

    @Tool(description = """
        Add a single menu item to the cart. You MUST provide all of:
        menuItemId, menuItemName, unitPrice, quantity, restaurantId,
        restaurantName. Get these by first calling getRestaurantDetails
        or searchRestaurants. Note that a cart can only contain items
        from one restaurant; adding from a different restaurant will
        replace the cart contents.
        """)
    public Object addItemToCart(
            @ToolParam(description = "The menu item id (UUID) from the restaurant menu") String menuItemId,
            @ToolParam(description = "Display name of the item, e.g. 'Margherita Pizza'") String menuItemName,
            @ToolParam(description = "Price per unit in INR") Double unitPrice,
            @ToolParam(description = "How many units to add, must be >= 1") Integer quantity,
            @ToolParam(description = "The restaurant's id (UUID)") String restaurantId,
            @ToolParam(description = "The restaurant's display name") String restaurantName) {

        tracker.record("addItemToCart");
        if (ctx.getUserId() == null) return "User is not logged in.";
        if (menuItemId == null || menuItemId.isBlank()) return "I need a menuItemId.";
        if (quantity == null || quantity < 1) return "Quantity must be at least 1.";
        if (unitPrice == null || unitPrice <= 0) return "Unit price must be greater than zero.";

        Map<String, Object> body = new HashMap<>();
        body.put("menuItemId",    menuItemId);
        body.put("menuItemName",  menuItemName);
        body.put("unitPrice",     BigDecimal.valueOf(unitPrice));
        body.put("quantity",      quantity);
        body.put("restaurantId",  restaurantId);
        body.put("restaurantName", restaurantName);

        Map<String, Object> response = client.postMap("/api/v1/cart/add", body);
        return response == null
                ? Map.of("error", "Failed to add to cart")
                : response;
    }

    // ─── Clear cart ────────────────────────────────────────────────

    @Tool(description = """
        Empty the user's cart entirely. Always confirm with the user
        before calling — they must explicitly say 'yes, clear it' or
        similar. Use this when the user wants to start over.
        """)
    public Object clearCart() {
        tracker.record("clearCart");
        if (ctx.getUserId() == null) return "User is not logged in.";

        Map<String, Object> response = client.deleteMap("/api/v1/cart/clear");
        return response == null ? Map.of("status", "cart cleared") : response;
    }

    // ─── Place order — the big one ─────────────────────────────────

    @Tool(description = """
        Place the order from the current cart. ALWAYS confirm with the
        user FIRST: tell them the cart contents and total, ask 'shall I
        place the order?', and only call this tool after they explicitly
        agree (yes / confirm / place it / go ahead).

        If addressId is null, the user's first saved address will be used.
        Returns the new order with its orderId, total, and estimated
        delivery time.
        """)
    public Object placeOrder(
            @ToolParam(description = "The delivery address id; pass null to use the user's first saved address",
                    required = false) String addressId,
            @ToolParam(description = "Optional special instructions for the restaurant", required = false)
            String specialInstructions) {

        tracker.record("placeOrder");
        if (ctx.getUserId() == null) return "User is not logged in.";

        // ── Resolve address if not supplied ──────────────────────────
        String resolvedAddressId = addressId;
        String resolvedAddressText = null;

        if (resolvedAddressId == null || resolvedAddressId.isBlank()) {
            List<Map<String, Object>> addresses = client.getList("/api/v1/users/addresses");
            if (addresses == null || addresses.isEmpty()) {
                return "You don't have any saved addresses. Please add one in the app first.";
            }
            Map<String, Object> first = addresses.get(0);
            resolvedAddressId = String.valueOf(
                    first.getOrDefault("addressId", first.getOrDefault("id", "")));
            resolvedAddressText = buildAddressString(first);
        }

        // ── Sanity: cart must not be empty ──────────────────────────
        Map<String, Object> cart = client.getMap("/api/v1/cart");
        if (cart == null || cart.get("item") == null
                || (cart.get("item") instanceof List<?> items && items.isEmpty())) {
            return "Your cart is empty. Add items before placing an order.";
        }

        // ── Build & send the place-order request ────────────────────
        Map<String, Object> body = new HashMap<>();
        body.put("deliveryAddressId", resolvedAddressId);
        if (resolvedAddressText != null) {
            body.put("deliverAddress", resolvedAddressText);
        }
        if (specialInstructions != null && !specialInstructions.isBlank()) {
            body.put("specialInstructions", specialInstructions);
        }

        Map<String, Object> response = client.postMap("/api/v1/orders/place", body);
        return response == null
                ? Map.of("error", "Failed to place the order")
                : response;
    }

    private String buildAddressString(Map<String, Object> a) {
        StringBuilder sb = new StringBuilder();
        appendIf(sb, a.get("addressLine"));
        appendIf(sb, a.get("street"));
        appendIf(sb, a.get("city"));
        appendIf(sb, a.get("state"));
        appendIf(sb, a.get("pincode"));
        return sb.toString().trim();
    }

    private void appendIf(StringBuilder sb, Object value) {
        if (value == null) return;
        String s = String.valueOf(value).trim();
        if (s.isEmpty() || "null".equals(s)) return;
        if (sb.length() > 0) sb.append(", ");
        sb.append(s);
    }
}
