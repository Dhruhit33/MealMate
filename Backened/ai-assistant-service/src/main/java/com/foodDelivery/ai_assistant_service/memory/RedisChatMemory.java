package com.foodDelivery.ai_assistant_service.memory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisChatMemory {

    private static final String KEY_PREFIX = "ai:chat:mem:";

    private final StringRedisTemplate redis;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${foodrush.ai.memory-window:8}")
    private int windowSize;

    @Value("${foodrush.ai.memory-ttl-seconds:3600}")
    private long ttlSeconds;

    public List<Message> get(String conversationId) {
        String key = KEY_PREFIX + conversationId;
        List<String> raw = redis.opsForList().range(key, 0, -1);
        if (raw == null || raw.isEmpty()) return Collections.emptyList();

        List<Message> messages = new ArrayList<>(raw.size());
        for (String json : raw) {
            try {
                StoredMessage sm = mapper.readValue(json, StoredMessage.class);
                if ("USER".equals(sm.type)) {
                    messages.add(new UserMessage(sm.content));
                } else if ("ASSISTANT".equals(sm.type)) {
                    messages.add(new AssistantMessage(sm.content));
                }
            } catch (JsonProcessingException e) {
                log.warn("Skipping corrupted memory entry: {}", e.getMessage());
            }
        }
        return messages;
    }

    public void append(String conversationId, Message message) {
        if (message == null) return;
        String type = message.getMessageType() == MessageType.USER ? "USER"
                : message.getMessageType() == MessageType.ASSISTANT ? "ASSISTANT"
                : null;
        if (type == null) return; // skip system / tool messages

        String key = KEY_PREFIX + conversationId;
        try {
            String json = mapper.writeValueAsString(new StoredMessage(type, message.getText()));
            redis.opsForList().rightPush(key, json);
            redis.opsForList().trim(key, -(windowSize * 2L), -1);
            redis.expire(key, Duration.ofSeconds(ttlSeconds));
        } catch (JsonProcessingException e) {
            log.warn("Failed to store chat message: {}", e.getMessage());
        }
    }

    public void clear(String conversationId) {
        redis.delete(KEY_PREFIX + conversationId);
    }
    private static class StoredMessage {
        public String type;
        public String content;
        public StoredMessage() {}
        public StoredMessage(String type, String content) {
            this.type = type;
            this.content = content;
        }
    }
}
