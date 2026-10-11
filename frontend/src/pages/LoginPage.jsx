import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { normaliseRole } from "../api/roles";

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
const CURRY = "#B5761A";


export default function LoginPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const login      = useAuthStore((s) => s.login);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState(null);

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name || "there"}! 🎉`);

      const role = normaliseRole(user.role);
      // If redirected from a specific protected page, go back there
      // But if it's just the root "/", let the role-based logic handle it
      if (from && from !== "/" && from !== "/login" && from !== "/register") {
        navigate(from, { replace: true });
        return;
      }
      if (role === "DRIVER")           navigate("/driver", { replace: true });
      else if (role === "RESTAURANT_OWNER") navigate("/owner", { replace: true });
      else                             navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at top left, ${BG} 0%, ${BG_DEEP} 100%)`,
      color: INK, overflow: "hidden", position: "relative",
      fontFamily: "var(--font-sans)",
    }}>
      {/* Ambient blobs */}
      <div style={{ position:"absolute", top:"-10%", left:"-5%", width:700, height:700,
        borderRadius:"50%", background:`radial-gradient(circle,${TERRACOTTA_SOFT}22 0%,transparent 55%)`,
        filter:"blur(80px)", animation:"drift 20s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:600, height:600,
        borderRadius:"50%", background:`radial-gradient(circle,${SAFFRON}1F 0%,transparent 60%)`,
        filter:"blur(80px)", animation:"drift 24s ease-in-out infinite reverse", pointerEvents:"none" }} />

      {/* Logo */}
      <div style={{ position:"relative", zIndex:10, padding:"28px 48px", display:"flex", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:11,
            background:`linear-gradient(135deg,${TERRACOTTA_SOFT},${TERRACOTTA} 60%,${TERRACOTTA_DEEP})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"var(--font-display)", fontSize:"1.35rem", fontWeight:700,
            color:"#FFF5E6", fontStyle:"italic", boxShadow:`0 6px 20px ${TERRACOTTA}30` }}>f</div>
          <span style={{ fontFamily:"var(--font-display)", fontSize:"1.45rem", letterSpacing:"-0.01em", color:INK }}>
            foodrush<span style={{ color:TERRACOTTA }}>.</span>
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="login-grid" style={{
        position:"relative", zIndex:5, maxWidth:1260, margin:"0 auto",
        padding:"20px 48px 60px",
        display:"grid", gridTemplateColumns:"1.15fr 1fr",
        gap:72, alignItems:"center", minHeight:"calc(100vh - 160px)",
      }}>
        {/* Left editorial */}
        <div style={{ animation:"fade-up 0.8s cubic-bezier(0.2,0.8,0.2,1) both" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
            padding:"7px 16px", borderRadius:999, background:`${TERRACOTTA}0E`,
            border:`1px solid ${TERRACOTTA}28`, marginBottom:28 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:TERRACOTTA,
              animation:"pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize:"0.72rem", color:TERRACOTTA_DEEP, textTransform:"uppercase",
              letterSpacing:"0.15em", fontWeight:600 }}>Live now in your city</span>
          </div>

          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(3.2rem,6.5vw,5.8rem)",
            fontWeight:400, lineHeight:0.95, letterSpacing:"-0.035em", marginBottom:28, color:INK }}>
            Hungry?<br />
            <span style={{ fontStyle:"italic",
              background:`linear-gradient(135deg,${TERRACOTTA_SOFT} 0%,${TERRACOTTA} 50%,${TERRACOTTA_DEEP} 100%)`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              We got you.
            </span>
          </h1>

          <p style={{ fontSize:"1.08rem", color:INK_SOFT, maxWidth:460, lineHeight:1.6, marginBottom:48 }}>
            Real food from real kitchens. Ordered in seconds, at your door in thirty minutes.{" "}
            <span style={{ fontStyle:"italic", color:TERRACOTTA_DEEP }}>Simple as that.</span>
          </p>

          <div style={{ display:"flex", gap:0, paddingTop:28, borderTop:`1px solid ${INK_HAIR}` }}>
            {[
              { num:"487", label:"Restaurants", suffix:"", color:TERRACOTTA },
              { num:"26",  label:"Avg. delivery", suffix:"min", color:SAFFRON },
              { num:"4.9", label:"Rating",       suffix:"★",  color:CURRY },
            ].map((s, i) => (
              <div key={s.label} style={{ flex:1,
                borderLeft: i > 0 ? `1px solid ${INK_HAIR}` : "none",
                paddingLeft: i > 0 ? 28 : 0,
                animation:`fade-up 0.6s ease-out ${0.3 + i * 0.1}s both` }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:"2.3rem", fontWeight:500,
                    color:INK, letterSpacing:"-0.02em" }}>{s.num}</span>
                  {s.suffix && <span style={{ fontSize:"0.9rem", color:s.color, fontWeight:600 }}>{s.suffix}</span>}
                </div>
                <div style={{ fontSize:"0.72rem", color:INK_MUTED, textTransform:"uppercase",
                  letterSpacing:"0.1em", marginTop:4, fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right form */}
        <div style={{ animation:"fade-up 0.8s cubic-bezier(0.2,0.8,0.2,1) 0.2s both",
          display:"flex", justifyContent:"center" }}>
          <div style={{ width:"100%", maxWidth:440, background:CARD,
            border:`1px solid ${INK_HAIR}`, borderRadius:24, padding:"42px 40px",
            position:"relative",
            boxShadow:`0 1px 2px ${INK_HAIR}, 0 4px 12px rgba(43,29,18,0.04), 0 28px 60px -20px rgba(43,29,18,0.18)` }}>

            <div style={{ position:"absolute", top:-1, right:-1, width:54, height:54,
              borderTop:`2px solid ${TERRACOTTA}`, borderRight:`2px solid ${TERRACOTTA}`,
              borderRadius:"0 24px 0 0", opacity:0.75 }} />

            <div style={{ marginBottom:32 }}>
              <h2 style={{ fontFamily:"var(--font-display)", fontSize:"2rem", fontWeight:400,
                marginBottom:6, color:INK, letterSpacing:"-0.02em" }}>Welcome back</h2>
              <p style={{ color:INK_SOFT, fontSize:"0.9rem" }}>
                Sign in to pick up where you left off
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom:18, position:"relative" }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                  placeholder=" " id="login-email"
                  style={{ width:"100%", padding:"22px 16px 10px",
                    background: focused === "email" ? FIELD_FOCUS : FIELD,
                    border:`1.5px solid ${focused === "email" ? TERRACOTTA : "transparent"}`,
                    borderRadius:12, color:INK, fontSize:"0.95rem",
                    fontFamily:"var(--font-sans)", outline:"none", transition:"all 0.25s",
                    boxShadow: focused === "email" ? `0 0 0 4px ${TERRACOTTA}12` : "none" }} />
                <label htmlFor="login-email" style={{ position:"absolute", left:16,
                  top: (focused === "email" || email) ? 8 : 18,
                  fontSize: (focused === "email" || email) ? "0.7rem" : "0.95rem",
                  color: focused === "email" ? TERRACOTTA : INK_MUTED,
                  textTransform: (focused === "email" || email) ? "uppercase" : "none",
                  letterSpacing: (focused === "email" || email) ? "0.1em" : "0",
                  fontWeight: (focused === "email" || email) ? 600 : 400,
                  pointerEvents:"none", transition:"all 0.2s ease" }}>Email address</label>
              </div>

              {/* Password */}
              <div style={{ marginBottom:28, position:"relative" }}>
                <input type={showPass ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)}
                  placeholder=" " id="login-pass"
                  style={{ width:"100%", padding:"22px 52px 10px 16px",
                    background: focused === "pass" ? FIELD_FOCUS : FIELD,
                    border:`1.5px solid ${focused === "pass" ? TERRACOTTA : "transparent"}`,
                    borderRadius:12, color:INK, fontSize:"0.95rem",
                    fontFamily:"var(--font-sans)", outline:"none", transition:"all 0.25s",
                    boxShadow: focused === "pass" ? `0 0 0 4px ${TERRACOTTA}12` : "none" }} />
                <label htmlFor="login-pass" style={{ position:"absolute", left:16,
                  top: (focused === "pass" || password) ? 8 : 18,
                  fontSize: (focused === "pass" || password) ? "0.7rem" : "0.95rem",
                  color: focused === "pass" ? TERRACOTTA : INK_MUTED,
                  textTransform: (focused === "pass" || password) ? "uppercase" : "none",
                  letterSpacing: (focused === "pass" || password) ? "0.1em" : "0",
                  fontWeight: (focused === "pass" || password) ? 600 : 400,
                  pointerEvents:"none", transition:"all 0.2s ease" }}>Password</label>
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                    background:"none", border:"none", cursor:"pointer", color:INK_MUTED, padding:6,
                    display:"flex", borderRadius:6 }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" disabled={loading} style={{
                width:"100%", padding:"17px", borderRadius:12, border:"none",
                background: loading ? INK_FAINT : `linear-gradient(135deg,${TERRACOTTA_SOFT},${TERRACOTTA} 55%,${TERRACOTTA_DEEP})`,
                color:"#FFF5E6", fontSize:"0.95rem", fontWeight:600,
                fontFamily:"var(--font-sans)", cursor: loading ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                letterSpacing:"0.01em", transition:"all 0.25s",
                boxShadow: loading ? "none" : `0 6px 20px ${TERRACOTTA}40, inset 0 1px 0 ${TERRACOTTA_SOFT}80` }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 12px 32px ${TERRACOTTA}55`; } }}
                onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=loading?"none":`0 6px 20px ${TERRACOTTA}40`; }}>
                {loading ? <Loader2 size={20} style={{ animation:"spin 0.8s linear infinite" }} />
                  : <>Sign in <span style={{ fontSize:"1.2rem" }}>→</span></>}
              </button>
            </form>

            <div style={{ marginTop:24, paddingTop:22, borderTop:`1px solid ${INK_HAIR}`,
              textAlign:"center", fontSize:"0.85rem", color:INK_SOFT }}>
              New to FoodRush?{" "}
              <Link to="/register" style={{ color:TERRACOTTA, textDecoration:"none", fontWeight:600,
                borderBottom:`1px dashed ${TERRACOTTA}60`, paddingBottom:1 }}>
                Start here
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade-up { from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)} }
        @keyframes drift { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,-30px)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;box-shadow:0 0 0 0 ${TERRACOTTA}99} 50%{opacity:.7;box-shadow:0 0 0 6px transparent} }
        @media (max-width:900px) {
          .login-grid { grid-template-columns:1fr!important; gap:40px!important; padding:20px 20px 40px!important; min-height:auto!important; }
        }
      `}</style>
    </div>
  );
}
