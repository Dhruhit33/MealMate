import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, ShieldCheck, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import api from "../api/axios";
import { normaliseRole } from "../api/roles";

const BG = "#FAF3E7";
const BG_DEEP = "#F0E4CF";
const CARD = "#FFF9EC";
const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_SOFT = "#E07848";
const TERRACOTTA_DEEP = "#8A2F18";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const email = useLocation().state?.email || "";
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef([]);

  // Redirect to register if no email was passed
  useEffect(() => {
    if (!email) {
      toast.error("No email found. Please register again.");
      navigate("/register", { replace: true });
    }
  }, [email, navigate]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      e.preventDefault();
      setOtp(text.split(""));
      refs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return toast.error("Enter the full 6-digit code");
    setLoading(true);
    try {
      const user = await verifyOtp(email, code);
      toast.success("Email verified! Welcome to FoodRush!");
      
      const role = normaliseRole(user.role);
      if (role === "DRIVER") navigate("/driver", { replace: true });
      else if (role === "RESTAURANT_OWNER") navigate("/owner", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await api.post("/auth/resend-otp", { email });
      toast.success("New OTP sent to your email!");
      setCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    } catch (err) {
      // If resend-otp endpoint doesn't exist, try re-registering
      // The OTP is also logged in the console for development
      toast.error(err.response?.data?.message || "Could not resend OTP. Check server logs for the OTP.");
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(ellipse at top left, ${BG} 0%, ${BG_DEEP} 100%)`,
      padding: 24, fontFamily: "var(--font-sans)",
    }}>
      <div style={{
        maxWidth: 460, width: "100%", textAlign: "center",
        animation: "fade-up 0.5s cubic-bezier(0.2,0.8,0.2,1) both",
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}20, ${TERRACOTTA}18)`,
          border: `1.5px solid ${TERRACOTTA}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px",
        }}>
          <ShieldCheck size={32} style={{ color: TERRACOTTA }} />
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 400,
          marginBottom: 8, color: INK, letterSpacing: "-0.02em",
        }}>Verify your email</h2>
        <p style={{ color: INK_SOFT, fontSize: "0.92rem", marginBottom: 40, lineHeight: 1.5 }}>
          We sent a 6-digit code to{" "}
          <span style={{ fontWeight: 600, color: INK }}>{email}</span>
        </p>

        {/* Card */}
        <div style={{
          background: CARD, border: `1px solid ${INK_HAIR}`, borderRadius: 24,
          padding: "36px 32px",
          boxShadow: `0 1px 2px ${INK_HAIR}, 0 4px 12px rgba(43,29,18,0.04), 0 28px 60px -20px rgba(43,29,18,0.18)`,
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 32 }}>
              {otp.map((d, i) => (
                <input key={i} ref={(el) => (refs.current[i] = el)}
                  type="text" inputMode="numeric" maxLength={1}
                  value={d} onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKey(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  style={{
                    width: 52, height: 60, textAlign: "center", fontSize: "1.5rem", fontWeight: 700,
                    fontFamily: "var(--font-sans)", borderRadius: 14,
                    border: `2px solid ${d ? TERRACOTTA : INK_HAIR}`,
                    background: d ? `${TERRACOTTA}08` : "#fff", color: INK,
                    outline: "none", transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = TERRACOTTA;
                    e.target.style.boxShadow = `0 0 0 3px ${TERRACOTTA}15`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = d ? TERRACOTTA : INK_HAIR;
                    e.target.style.boxShadow = "none";
                  }}
                />
              ))}
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "17px", borderRadius: 14, border: "none",
              background: loading ? INK_HAIR : `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
              color: "#FFF5E6", fontSize: "0.95rem", fontWeight: 600,
              fontFamily: "var(--font-sans)", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              letterSpacing: "0.01em", transition: "all 0.25s",
              boxShadow: loading ? "none" : `0 6px 20px ${TERRACOTTA}40, inset 0 1px 0 ${TERRACOTTA_SOFT}80`,
            }}
              onMouseEnter={(e) => {
                if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${TERRACOTTA}55`; }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = loading ? "none" : `0 6px 20px ${TERRACOTTA}40`;
              }}
            >
              {loading ? <Loader2 size={20} style={{ animation: "spin 0.8s linear infinite" }} /> : <>Verify & continue <span style={{ fontSize: "1.2rem" }}>→</span></>}
            </button>
          </form>

          {/* Resend */}
          <div style={{
            marginTop: 24, paddingTop: 20, borderTop: `1px solid ${INK_HAIR}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: "0.85rem", color: INK_MUTED }}>Didn't get the code?</span>
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              style={{
                background: "none", border: "none",
                color: cooldown > 0 ? INK_MUTED : TERRACOTTA,
                fontWeight: 600, cursor: cooldown > 0 ? "default" : "pointer",
                fontFamily: "var(--font-sans)", fontSize: "0.85rem",
                display: "inline-flex", alignItems: "center", gap: 5,
                opacity: cooldown > 0 ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {resending ? (
                <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
              ) : (
                <RotateCcw size={14} />
              )}
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
            </button>
          </div>
        </div>

        {/* Tip */}
        <p style={{
          marginTop: 20, fontSize: "0.78rem", color: INK_MUTED,
          lineHeight: 1.5,
        }}>
          💡 Check your spam folder if you don't see the email.
          <br />In development mode, the OTP is also printed in the server logs.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
