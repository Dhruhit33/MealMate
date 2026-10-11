import api from "../api/axios";

/**
 * AI Assistant API client.
 * Routes through the same /api/v1 base as everything else; api-gateway
 * handles auth and forwards to ai-assistant-service.
 */
export const aiService = {
  async chat(message, conversationId) {
    const res = await api.post("/ai/chat", { message, conversationId });
    return res.data; // { reply, conversationId, toolsCalled, timestamp }
  },

  async clearHistory(conversationId) {
    await api.delete("/ai/chat/history", {
      params: conversationId ? { conversationId } : {},
    });
  },
};
