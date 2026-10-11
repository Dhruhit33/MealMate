package com.foodDelivery.ai_assistant_service.client;

import com.foodDelivery.ai_assistant_service.config.RequestContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;



@Component
@RequiredArgsConstructor
@Slf4j
public class FoodRushClient {

    private static final Duration TIMEOUT = Duration.ofSeconds(8);

    private final WebClient gatewayWebClient;
    private final RequestContext requestContext;

    // ─── Generic helpers ───────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Map<String, Object> getMap(String path) {
        return (Map<String, Object>) get(path, Map.class);
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getList(String path) {
        Object body = get(path, List.class);
        return body == null ? List.of() : (List<Map<String, Object>>) body;
    }

    public <T> T get(String path, Class<T> bodyType) {
        try {
            return gatewayWebClient.get()
                    .uri(path)
                    .headers(this::applyAuth)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(bodyType)
                    .block(TIMEOUT);
        } catch (WebClientResponseException e) {
            log.warn("GET {} failed: status={} body={}", path, e.getStatusCode(), e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            log.warn("GET {} errored: {}", path, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> deleteMap(String path) {
        try {
            return gatewayWebClient.delete()
                    .uri(path)
                    .headers(this::applyAuth)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(TIMEOUT);
        } catch (WebClientResponseException e) {
            log.warn("DELETE {} failed: status={} body={}", path, e.getStatusCode(), e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            // Some delete endpoints return plain text not JSON — don't treat that as failure.
            log.debug("DELETE {} parse error (likely plain text response): {}", path, e.getMessage());
            return Map.of("status", "ok");
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> postMap(String path, Object body) {
        try {
            return gatewayWebClient.post()
                    .uri(path)
                    .headers(this::applyAuth)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .bodyValue(body == null ? Map.of() : body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(TIMEOUT);
        } catch (WebClientResponseException e) {
            log.warn("POST {} failed: status={} body={}", path, e.getStatusCode(), e.getResponseBodyAsString());
            return Map.of("error", e.getStatusCode().toString(),
                    "body", e.getResponseBodyAsString());
        } catch (Exception e) {
            log.warn("POST {} errored: {}", path, e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    private void applyAuth(HttpHeaders h) {
        String bearer = requestContext.bearer();
        if (bearer != null) {
            h.set(HttpHeaders.AUTHORIZATION, bearer);
        }
    }
}
