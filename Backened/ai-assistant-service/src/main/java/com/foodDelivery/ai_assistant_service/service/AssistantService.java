package com.foodDelivery.ai_assistant_service.service;

import com.foodDelivery.ai_assistant_service.config.RequestContext;
import com.foodDelivery.ai_assistant_service.dto.ChatRequest;
import com.foodDelivery.ai_assistant_service.dto.ChatResponse;
import com.foodDelivery.ai_assistant_service.memory.RedisChatMemory;
import com.foodDelivery.ai_assistant_service.tools.*;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class AssistantService {

    private static final String SYSTEM_PROMPT = """
        You are FoodRush Assistant, a helpful agent inside a food-delivery app.
        You answer questions about the signed-in user's orders, wallet, restaurants,
        and deliveries by calling the available tools — never make up data.

        Rules:
        - When the user mentions 'my order', 'my wallet', 'my profile' etc., call
          the corresponding tool. Do not ask for the userId — it is already known.
        - For order-status questions WITHOUT an orderId, call getMyOrders first
          and pick the most recent active order (status not in COMPLETED/CANCELLED).
        - Before any DESTRUCTIVE action (cancelOrder, addFundsToWallet) you MUST
          confirm with the user in plain language and wait for explicit yes.
        - Format prices in INR with the rupee symbol.
        - Keep replies SHORT and conversational — typically 1 to 3 sentences.
          Your reply may be spoken aloud by a text-to-speech engine, so:
            * NEVER use markdown — no asterisks, no bullets, no headers, no code blocks.
            * NEVER use emojis.
            * Spell out symbols when ambiguous (say "rupees" instead of just the symbol).
            * Use natural spoken language, like you are talking to a friend.
            * For lists of 3+ items, say things like "you have three orders:
              one from Pizza Hut, one from KFC, and one from Domino's" rather than
              dumping a numbered list.
        - If a tool returns an error or empty result, say so honestly and suggest
          a next step. Do not retry the same tool with the same arguments.
        - Never reveal internal ids unless the user explicitly asks for them.
        """;

    private final ChatClient chatClient;
    private final RedisChatMemory memory;
    private final RequestContext ctx;
    private final ToolCallTracker tracker;
    private final Timer chatTimer;

    public AssistantService(ChatModel chatModel,
                            RedisChatMemory memory,
                            RequestContext ctx,
                            ToolCallTracker tracker,
                            OrderTools orderTools,
                            RestaurantTools restaurantTools,
                            WalletTools walletTools,
                            UserTools userTools,
                            CartTools cartTools,
                            MeterRegistry meterRegistry) {
        this.memory = memory;
        this.ctx = ctx;
        this.tracker = tracker;
        this.chatTimer = Timer.builder("foodrush_ai_chat_duration_seconds")
                .description("Duration of an end-to-end AI chat request")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry);

        // Build a ChatClient with all tool beans pre-registered.
        // Spring AI 1.0 reflects on @Tool methods to build the function spec.
        this.chatClient = ChatClient.builder(chatModel)
                .defaultSystem(SYSTEM_PROMPT)
                .defaultTools(orderTools, restaurantTools, walletTools, userTools, cartTools)
                .build();
    }

    public ChatResponse chat(ChatRequest req) {
        long start = System.nanoTime();
        try {
            String conversationId = (req.getConversationId() == null || req.getConversationId().isBlank())
                    ? defaultConversationId()
                    : req.getConversationId();

            // ── Build the full prompt: memory + new user message ──
            List<Message> messages = new ArrayList<>(memory.get(conversationId));
            UserMessage userMsg = new UserMessage(req.getMessage());
            messages.add(userMsg);

            // ── Call Gemini (with tools) ───────────────────────────────────
            String reply;
            try {
                reply = chatClient.prompt(new Prompt(messages))
                        .call()
                        .content();
            } catch (Exception e) {
                log.error("LLM call failed", e);
                return ChatResponse.builder()
                        .reply("Sorry, I'm having trouble reaching my brain right now. Please try again in a moment.")
                        .conversationId(conversationId)
                        .toolsCalled(List.copyOf(tracker.getCalls()))
                        .timestamp(Instant.now())
                        .build();
            }

            // ── Persist to memory (only the final user/assistant exchange) ──
            memory.append(conversationId, userMsg);
            memory.append(conversationId, new AssistantMessage(reply));

            return ChatResponse.builder()
                    .reply(reply)
                    .conversationId(conversationId)
                    .toolsCalled(List.copyOf(tracker.getCalls()))
                    .timestamp(Instant.now())
                    .build();
        } finally {
            chatTimer.record(java.time.Duration.ofNanos(System.nanoTime() - start));
        }
    }

    public void clearConversation(String conversationId) {
        if (conversationId == null || conversationId.isBlank()) {
            conversationId = defaultConversationId();
        }
        memory.clear(conversationId);
    }

    private String defaultConversationId() {
        // Use the userId so each user has one default chat thread
        String uid = ctx.getUserId();
        return uid == null ? "anonymous-" + Instant.now().toEpochMilli() : "user:" + uid;
    }
}
