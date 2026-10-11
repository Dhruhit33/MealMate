package com.foodDelivery.ai_assistant_service.tools;

import com.foodDelivery.ai_assistant_service.client.FoodRushClient;
import com.foodDelivery.ai_assistant_service.config.RequestContext;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class UserTools {

    private final FoodRushClient client;
    private final RequestContext ctx;
    private final ToolCallTracker tracker;

    @Tool(description = """
        Get the current user's profile (name, email, phone, role).
        Use this when the user asks 'who am I', 'what's my email',
        or you need to address them by name.
        """)
    public Object getMyProfile() {
        tracker.record("getMyProfile");
        if (ctx.getUserId() == null) return "User is not logged in.";

        Map<String, Object> profile = client.getMap("/api/v1/users/profile");
        return profile == null ? "Profile not found." : profile;
    }

    @Tool(description = """
        Get the user's saved delivery addresses. Useful when they ask
        'what are my addresses', or before placing an order to confirm
        which address to deliver to.
        """)
    public Object getMyAddresses() {
        tracker.record("getMyAddresses");
        if (ctx.getUserId() == null) return "User is not logged in.";

        List<Map<String, Object>> addresses = client.getList("/api/v1/users/addresses");
        if (addresses == null || addresses.isEmpty()) {
            return "You have no saved addresses yet.";
        }
        return addresses;
    }
}
