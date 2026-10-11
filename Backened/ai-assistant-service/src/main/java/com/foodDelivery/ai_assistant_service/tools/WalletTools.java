package com.foodDelivery.ai_assistant_service.tools;

import com.foodDelivery.ai_assistant_service.client.FoodRushClient;
import com.foodDelivery.ai_assistant_service.config.RequestContext;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class WalletTools {

    private final FoodRushClient client;
    private final RequestContext ctx;
    private final ToolCallTracker tracker;

    @Tool(description = """
        Get the current user's wallet balance, locked funds (if any),
        and currency. Use for 'how much money do I have', 'wallet balance',
        'how much is left in my wallet'.
        """)
    public Object getWalletBalance() {
        tracker.record("getWalletBalance");
        if (ctx.getUserId() == null) return "User is not logged in.";

        Map<String, Object> wallet = client.getMap("/api/v1/wallet/balance");
        if (wallet == null) {
            return "I couldn't fetch your wallet — it may not be set up yet. "
                    + "Try calling createWallet first.";
        }
        return wallet;
    }

    @Tool(description = """
        Add funds to the user's wallet. ALWAYS confirm with the user
        before calling — the user must explicitly approve the amount.
        Returns the new wallet balance.
        """)
    public Object addFundsToWallet(
            @ToolParam(description = "Amount to add, in INR. Must be > 0") Double amount) {
        tracker.record("addFundsToWallet");
        if (ctx.getUserId() == null) return "User is not logged in.";
        if (amount == null || amount <= 0) return "Amount must be greater than zero.";

        Map<String, Object> response = client.postMap(
                "/api/v1/wallet/add-funds",
                Map.of("amount", BigDecimal.valueOf(amount))
        );
        return response == null ? Map.of("error", "Failed to add funds") : response;
    }

    @Tool(description = """
        Create a wallet for the current user, if they don't have one yet.
        Most users already have a wallet — only call this if getWalletBalance
        indicates the wallet doesn't exist.
        """)
    public Object createWallet() {
        tracker.record("createWallet");
        if (ctx.getUserId() == null) return "User is not logged in.";
        Map<String, Object> response = client.postMap("/api/v1/wallet/create", null);
        return response == null ? Map.of("error", "Failed to create wallet") : response;
    }
}
