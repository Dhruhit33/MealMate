import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

const BG = "#FAF3E7";
const BG_DEEP = "#F0E4CF";
const CARD = "#FFF9EC";
const FIELD = "#F5EAD4";
const FIELD_FOCUS = "#FFFEF8";
const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_FAINT = "rgba(43,29,18,0.14)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_SOFT = "#E07848";
const TERRACOTTA_DEEP = "#8A2F18";
const SAFFRON = "#D98B3E";
const PISTACHIO = "#6B7F4A";

const ROLES = [
  { value: "CUSTOMER", label: "Order food", desc: "I'm hungry and here to eat", emoji: "🍽" },
  { value: "RESTAURANT_OWNER", label: "Run a kitchen", desc: "I own or manage a restaurant", emoji: "👨‍🍳" },
  { value: "DRIVER", label: "Deliver orders", desc: "I want to earn as a delivery partner", emoji: "🛵" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "CUSTOMER" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) return toast.error("Please fill all fields");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const res = await register(form);
      toast.success(res.message || "Account created! Verify your email.");
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Registration failed. Please check your connection.";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const fieldStyle = (name) => ({
    width: "100%", padding: "22px 16px 10px",
    background: focused === name ? FIELD_FOCUS : FIELD,
    border: `1.5px solid ${focused === name ? TERRACOTTA : "transparent"}`,
    borderRadius: 12, color: INK, fontSize: "0.95rem",
    fontFamily: "var(--font-sans)", outline: "none", transition: "all 0.25s",
    boxShadow: focused === name ? `0 0 0 4px ${TERRACOTTA}12` : "none",
  });

  const labelStyle = (name, value) => ({
    position: "absolute", left: 16,
    top: (focused === name || value) ? 8 : 18,
    fontSize: (focused === name || value) ? "0.7rem" : "0.95rem",
    color: focused === name ? TERRACOTTA : INK_MUTED,
    textTransform: (focused === name || value) ? "uppercase" : "none",
    letterSpacing: (focused === name || value) ? "0.1em" : "0",
    fontWeight: (focused === name || value) ? 600 : 400,
    pointerEvents: "none", transition: "all 0.2s ease",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at top left, ${BG} 0%, ${BG_DEEP} 100%)`,
      color: INK, overflow: "hidden", position: "relative",
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{
        position: "absolute", top: "10%", right: "0%",
        width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${TERRACOTTA_SOFT}22 0%, transparent 55%)`,
        filter: "blur(80px)", animation: "drift 20s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "0%", left: "0%",
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${PISTACHIO}20 0%, transparent 60%)`,
        filter: "blur(80px)", animation: "drift 24s ease-in-out infinite reverse",
      }} />
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none", mixBlendMode: "multiply",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence baseFrequency='0.85' numOctaves='2'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>")`,
      }} />

      {/* Top nav */}
      <div style={{
        position: "relative", zIndex: 10, padding: "28px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <Link to="/login" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          color: INK_SOFT, textDecoration: "none",
          fontSize: "0.85rem", padding: "8px 16px", borderRadius: 999,
          border: `1px solid ${INK_FAINT}`, transition: "all 0.2s",
          background: `${CARD}80`, backdropFilter: "blur(8px)",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = INK_MUTED; e.currentTarget.style.color = INK; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = INK_FAINT; e.currentTarget.style.color = INK_SOFT; }}
        >
          <ArrowLeft size={14} /> Back to login
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 60%, ${TERRACOTTA_DEEP})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700,
            color: "#FFF5E6", fontStyle: "italic",
            boxShadow: `0 6px 20px ${TERRACOTTA}30`,
          }}>f</div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", color: INK }}>
            foodrush<span style={{ color: TERRACOTTA }}>.</span>
          </span>
        </div>
      </div>

      <div style={{
        position: "relative", zIndex: 5, maxWidth: 540,
        margin: "0 auto", padding: "30px 24px 60px",
      }}>
        <div style={{ animation: "fade-up 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both", textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "7px 16px", borderRadius: 999,
            background: `${TERRACOTTA}0E`, border: `1px solid ${TERRACOTTA}28`,
            marginBottom: 24,
          }}>
            <span style={{
              fontSize: "0.72rem", color: TERRACOTTA_DEEP,
              textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600,
            }}>Join 50,000+ food lovers</span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "3.2rem",
            fontWeight: 400, lineHeight: 1, letterSpacing: "-0.03em",
            marginBottom: 14, color: INK,
          }}>
            Let's <span style={{
              background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA}, ${TERRACOTTA_DEEP})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontStyle: "italic",
            }}>get started</span>
          </h1>
          <p style={{ fontSize: "1rem", color: INK_SOFT, maxWidth: 380, margin: "0 auto" }}>
            Tell us a bit about yourself. Takes less than a minute.
          </p>
        </div>

        <div style={{
          background: CARD,
          border: `1px solid ${INK_HAIR}`,
          borderRadius: 24, padding: "38px 34px",
          boxShadow: `0 1px 2px ${INK_HAIR}, 0 4px 12px rgba(43,29,18,0.04), 0 28px 60px -20px rgba(43,29,18,0.18)`,
          animation: "fade-up 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s both",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: -1, right: -1,
            width: 54, height: 54,
            borderTop: `2px solid ${TERRACOTTA}`,
            borderRight: `2px solid ${TERRACOTTA}`,
            borderRadius: "0 24px 0 0", opacity: 0.75,
          }} />

          <form onSubmit={handleSubmit}>
            {/* Role selection */}
            <div style={{ marginBottom: 30 }}>
              <div style={{
                fontSize: "0.72rem", color: INK_MUTED,
                textTransform: "uppercase", letterSpacing: "0.15em",
                fontWeight: 600, marginBottom: 14,
              }}>I want to</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ROLES.map((r) => {
                  const selected = form.role === r.value;
                  return (
                    <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 14,
                      border: `1.5px solid ${selected ? TERRACOTTA : INK_HAIR}`,
                      background: selected ? `${TERRACOTTA}0C` : FIELD,
                      cursor: "pointer", textAlign: "left",
                      fontFamily: "var(--font-sans)", transition: "all 0.25s",
                    }}>
                      <div style={{
                        fontSize: "1.5rem", lineHeight: 1,
                        filter: selected ? "none" : "grayscale(40%) opacity(0.7)",
                        transition: "filter 0.25s",
                      }}>{r.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: "0.92rem", fontWeight: 600,
                          color: selected ? INK : INK_SOFT,
                        }}>{r.label}</div>
                        <div style={{
                          fontSize: "0.78rem",
                          color: selected ? `${TERRACOTTA_DEEP}CC` : INK_MUTED,
                          marginTop: 2,
                        }}>{r.desc}</div>
                      </div>
                      {selected && (
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA_DEEP})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          animation: "scale-in 0.2s ease-out",
                        }}>
                          <Check size={13} color="#FFF5E6" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {[
              { key: "name", label: "Full name", type: "text" },
              { key: "email", label: "Email address", type: "email" },
              { key: "phone", label: "Phone number", type: "tel" },
              { key: "password", label: "Password (min 6)", type: "password" },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 14, position: "relative" }}>
                <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder=" " id={f.key}
                  onFocus={() => setFocused(f.key)} onBlur={() => setFocused(null)}
                  style={fieldStyle(f.key)} />
                <label htmlFor={f.key} style={labelStyle(f.key, form[f.key])}>{f.label}</label>
              </div>
            ))}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "17px", marginTop: 20,
              borderRadius: 12, border: "none",
              background: loading ? INK_FAINT : `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
              color: "#FFF5E6", fontSize: "0.95rem", fontWeight: 600,
              fontFamily: "var(--font-sans)", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              letterSpacing: "0.01em", transition: "all 0.25s",
              boxShadow: loading ? "none" : `0 6px 20px ${TERRACOTTA}40, inset 0 1px 0 ${TERRACOTTA_SOFT}80`,
            }}
              onMouseEnter={(e) => {
                if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${TERRACOTTA}55, inset 0 1px 0 ${TERRACOTTA_SOFT}80`; }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = loading ? "none" : `0 6px 20px ${TERRACOTTA}40, inset 0 1px 0 ${TERRACOTTA_SOFT}80`;
              }}
            >
              {loading ? <Loader2 size={20} style={{ animation: "spin 0.8s linear infinite" }} /> : <>Create my account <span style={{ fontSize: "1.2rem" }}>→</span></>}
            </button>
          </form>

          <div style={{
            marginTop: 22, paddingTop: 20,
            borderTop: `1px solid ${INK_HAIR}`,
            textAlign: "center", fontSize: "0.85rem", color: INK_SOFT,
          }}>
            Already have an account?{" "}
            <Link to="/login" style={{
              color: TERRACOTTA, textDecoration: "none", fontWeight: 600,
              borderBottom: `1px dashed ${TERRACOTTA}60`, paddingBottom: 1,
            }}>Sign in</Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, -30px); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 600px) {
          .register-form-wrap {
            padding: 16px 16px 40px !important;
          }
          .register-form-wrap h1 {
            font-size: 2.2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
