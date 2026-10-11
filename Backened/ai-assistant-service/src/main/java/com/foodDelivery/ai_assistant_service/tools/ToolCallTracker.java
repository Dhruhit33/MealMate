package com.foodDelivery.ai_assistant_service.tools;


import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import java.util.ArrayList;
import java.util.List;

@Component
@RequestScope
@Slf4j
public class ToolCallTracker {

    private final List<String> calls = new ArrayList<>();

    private final MeterRegistry meterRegistry;


    @Autowired
    public  ToolCallTracker (MeterRegistry meterRegistry){
        this.meterRegistry = meterRegistry;
    }

    public void record(String toolName) {
        calls.add(toolName);
        Counter.builder("foodrush_ai_tool_calls_total")
                .description("Total number of tool calls by the AI agent, per tool")
                .tag("tool", toolName)
                .register(meterRegistry)
                .increment();
    }
    public List<String> getCalls() {
        return List.copyOf(calls);
    }
}
