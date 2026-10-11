package com.foodDelivery.ai_assistant_service.controller;

import com.foodDelivery.ai_assistant_service.config.RequestContext;
import com.foodDelivery.ai_assistant_service.dto.ChatRequest;
import com.foodDelivery.ai_assistant_service.dto.ChatResponse;
import com.foodDelivery.ai_assistant_service.service.AssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;
    private final RequestContext ctx;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        if (ctx.getUserId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    ChatResponse.builder()
                            .reply("Please log in to chat with the assistant.")
                            .timestamp(Instant.now())
                            .build());
        }
        return ResponseEntity.ok(assistantService.chat(request));
    }

    @DeleteMapping("/chat/history")
    public ResponseEntity<Map<String, String>> clearHistory(
            @RequestParam(required = false) String conversationId) {
        assistantService.clearConversation(conversationId);
        return ResponseEntity.ok(Map.of("status", "cleared"));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "service", "ai-assistant-service",
                "status",  "UP",
                "time",    Instant.now().toString()
        ));
    }
}
