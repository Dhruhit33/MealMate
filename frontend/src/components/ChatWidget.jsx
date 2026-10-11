import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, X, Send, Loader2, Sparkles, Trash2,
  Mic, MicOff, Volume2, VolumeX,
} from "lucide-react";
import { aiService } from "../services/aiService";
import { useAuthStore } from "../store/authStore";
import { useVoice } from "../hooks/useVoice";
import toast from "react-hot-toast";

// ── Design tokens (match the rest of the app) ─────────────────────────
const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const CARD = "#FFF9EC";
const FIELD = "#F5EAD4";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_DEEP = "#8A2F18";
const RED_LIVE = "#D7263D";

const SUGGESTED_PROMPTS = [
  "Where is my latest order?",
  "How much is in my wallet?",
  "Show me my recent orders",
  "What are the top-rated restaurants?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);   // typing OFF, voice ON
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your FoodRush assistant. Ask me about your orders, wallet, or restaurants — by typing or by voice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const sentTranscriptRef = useRef("");

  const voice = useVoice({ lang: "en-US" });

  // ── Auto-scroll on new message ────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // ── Focus input when opened in text mode ──────────────────────────
  useEffect(() => {
    if (open && !voiceMode && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, voiceMode]);

  // ── When the user finishes speaking, auto-send the transcript ─────
  useEffect(() => {
    if (!voiceMode) return;
    if (!voice.transcript) return;
    if (voice.listening) return;
    if (loading) return;
    if (sentTranscriptRef.current === voice.transcript) return;

    sentTranscriptRef.current = voice.transcript;
    send(voice.transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.transcript, voice.listening, voiceMode, loading]);

  // ── Stop everything if the widget is closed ────────────────────────
  useEffect(() => {
    if (!open) {
      voice.stop();
      voice.cancelSpeech();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Stop voice if user toggles voice mode off ──────────────────────
  useEffect(() => {
    if (!voiceMode) {
      voice.stop();
      voice.cancelSpeech();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode]);

  // Don't render for non-authenticated or non-customer users
  if (!token || (user?.role && user.role !== "CUSTOMER")) {
    return null;
  }

  // ── Send a message (typed or spoken) ───────────────────────────────
  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await aiService.chat(text, conversationId);
      if (res.conversationId && !conversationId) {
        setConversationId(res.conversationId);
      }
      const replyText = res.reply || "(no response)";
      setMessages((m) => [
        ...m,
        { role: "assistant", text: replyText, tools: res.toolsCalled || [] },
      ]);

      // ── In voice mode: speak the reply, then auto-restart listening ──
      if (voiceMode) {
        voice.speak(replyText, {
          onEnd: () => {
            // Small delay so the user perceives a turn boundary
            setTimeout(() => {
              if (voiceMode && open) voice.start();
            }, 250);
          },
        });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.reply ||
        "Sorry, something went wrong. Please try again.";
      setMessages((m) => [...m, { role: "assistant", text: msg, error: true }]);
      if (voiceMode) voice.speak(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await aiService.clearHistory(conversationId);
      setMessages([
        { role: "assistant", text: "Conversation cleared. How can I help?" },
      ]);
      sentTranscriptRef.current = "";
      toast.success("Chat history cleared");
    } catch {
      toast.error("Couldn't clear history");
    }
  };

  // ── Toggle voice mode on/off ───────────────────────────────────────
  const toggleVoiceMode = () => {
    if (!voice.supported) {
      toast.error("Your browser doesn't support voice input. Try Chrome, Edge, or Safari.");
      return;
    }
    if (voiceMode) {
      setVoiceMode(false);
    } else {
      setVoiceMode(true);
      sentTranscriptRef.current = "";
      setTimeout(() => voice.start(), 100);
    }
  };

  // ── Tap mic again while listening = stop & send what we have ──────
  const handleMicTap = () => {
    if (voice.listening) {
      voice.stop();
    } else {
      sentTranscriptRef.current = "";
      voice.start();
    }
  };

  return (
    <>
      {/* ── Floating launcher button ────────────────────────────── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI Assistant"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${TERRACOTTA} 0%, ${TERRACOTTA_DEEP} 100%)`,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(193, 74, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9998,
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <MessageCircle size={26} strokeWidth={2.2} />
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              background: "#FFD93D",
              color: INK,
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 10,
              border: "2px solid #fff",
            }}
          >
            AI
          </span>
        </button>
      )}

      {/* ── Chat panel ──────────────────────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-label="FoodRush AI Assistant"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 380,
            maxWidth: "calc(100vw - 32px)",
            height: 580,
            maxHeight: "calc(100vh - 48px)",
            background: CARD,
            borderRadius: 18,
            boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
            border: `1px solid ${INK_HAIR}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
            animation: "fr-slide-up 0.25s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background: `linear-gradient(135deg, ${TERRACOTTA} 0%, ${TERRACOTTA_DEEP} 100%)`,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <Sparkles size={18} />
                {voice.speaking && (
                  <span style={{
                    position: "absolute", inset: -3,
                    border: "2px solid #fff",
                    borderRadius: "50%",
                    animation: "fr-pulse 1.2s ease-out infinite",
                  }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>FoodRush Assistant</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  {voiceMode
                    ? voice.listening
                      ? "Listening…"
                      : voice.speaking
                        ? "Speaking…"
                        : "Voice mode • tap mic to talk"
                    : "Powered by Gemini"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={toggleVoiceMode}
                aria-label={voiceMode ? "Switch to text mode" : "Switch to voice mode"}
                title={voiceMode ? "Switch to text mode" : "Switch to voice mode"}
                style={{ ...iconBtn, background: voiceMode ? "#fff" : "rgba(255,255,255,0.15)", color: voiceMode ? TERRACOTTA_DEEP : "#fff" }}
              >
                {voiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button onClick={clearHistory} aria-label="Clear conversation" title="Clear conversation" style={iconBtn}>
                <Trash2 size={16} />
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close" style={iconBtn}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.text} tools={m.tools} error={m.error} />
            ))}

            {/* Live transcript while user is speaking */}
            {voiceMode && voice.listening && voice.interim && (
              <div style={{
                alignSelf: "flex-end",
                maxWidth: "85%",
                padding: "10px 14px",
                background: "rgba(193, 74, 42, 0.15)",
                color: TERRACOTTA_DEEP,
                borderRadius: 14,
                fontSize: 13,
                fontStyle: "italic",
                border: `1px dashed ${TERRACOTTA}`,
              }}>
                {voice.interim}…
              </div>
            )}

            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: INK_SOFT,
                  fontSize: 13,
                  padding: "8px 12px",
                  background: FIELD,
                  borderRadius: 12,
                }}
              >
                <Loader2 size={14} className="fr-spin" />
                Thinking…
              </div>
            )}
          </div>

          {/* Suggested prompts (only when conversation is fresh and not voice mode) */}
          {messages.length === 1 && !loading && !voiceMode && (
            <div style={{
              padding: "0 12px 8px",
              display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0,
            }}>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  style={{
                    fontSize: 11,
                    padding: "6px 10px",
                    background: FIELD,
                    color: INK,
                    border: `1px solid ${INK_HAIR}`,
                    borderRadius: 12,
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* ── Footer: voice mode shows a big mic; text mode shows input ── */}
          {voiceMode ? (
            <VoiceFooter
              listening={voice.listening}
              speaking={voice.speaking}
              loading={loading}
              onMicTap={handleMicTap}
              onCancelSpeech={voice.cancelSpeech}
            />
          ) : (
            <div style={{
              padding: "12px",
              borderTop: `1px solid ${INK_HAIR}`,
              background: "#fff",
              display: "flex",
              gap: 8,
              flexShrink: 0,
            }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask about orders, wallet, restaurants…"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: FIELD,
                  border: "none",
                  borderRadius: 12,
                  outline: "none",
                  fontSize: 13,
                  color: INK,
                }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                aria-label="Send"
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: input.trim() && !loading ? TERRACOTTA : INK_HAIR,
                  color: "#fff",
                  border: "none",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fr-slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fr-pulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0;   }
        }
        @keyframes fr-mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(215, 38, 61, 0.6); }
          50%      { box-shadow: 0 0 0 14px rgba(215, 38, 61, 0); }
        }
        .fr-spin { animation: fr-spin 1s linear infinite; }
        @keyframes fr-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ── Voice mode footer ─────────────────────────────────────────────────
function VoiceFooter({ listening, speaking, loading, onMicTap, onCancelSpeech }) {
  let label = "Tap to speak";
  if (listening) label = "Listening… tap to send";
  else if (speaking) label = "Speaking… tap to interrupt";
  else if (loading) label = "Thinking…";

  return (
    <div style={{
      padding: "16px 12px 18px",
      borderTop: `1px solid ${INK_HAIR}`,
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      flexShrink: 0,
    }}>
      <button
        onClick={speaking ? onCancelSpeech : onMicTap}
        disabled={loading}
        aria-label={listening ? "Stop listening" : "Start listening"}
        style={{
          width: 64, height: 64, borderRadius: "50%",
          background: listening
            ? RED_LIVE
            : speaking
              ? TERRACOTTA_DEEP
              : `linear-gradient(135deg, ${TERRACOTTA} 0%, ${TERRACOTTA_DEEP} 100%)`,
          color: "#fff",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: listening ? "fr-mic-pulse 1.4s infinite" : "none",
          transition: "background 0.2s",
        }}
      >
        {listening ? <Mic size={28} /> : speaking ? <Volume2 size={28} /> : <MicOff size={28} />}
      </button>
      <div style={{ fontSize: 12, color: INK_SOFT, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

// ── Single chat bubble ─────────────────────────────────────────────────
function Bubble({ role, text, tools, error }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "85%",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          background: isUser ? TERRACOTTA : error ? "#FFE5E0" : FIELD,
          color: isUser ? "#fff" : error ? TERRACOTTA_DEEP : INK,
          borderRadius: 14,
          borderBottomRightRadius: isUser ? 4 : 14,
          borderBottomLeftRadius:  isUser ? 14 : 4,
          fontSize: 13,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {text}
      </div>
      {tools && tools.length > 0 && (
        <div
          style={{
            fontSize: 10,
            color: INK_SOFT,
            paddingLeft: 4,
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {tools.map((t, i) => (
            <span
              key={i}
              style={{
                background: "rgba(193, 74, 42, 0.08)",
                color: TERRACOTTA_DEEP,
                padding: "1px 6px",
                borderRadius: 6,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const iconBtn = {
  width: 30,
  height: 30,
  borderRadius: 8,
  background: "rgba(255,255,255,0.15)",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
