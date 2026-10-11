import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, History, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useDriverStore } from "../store/driverStore";

const BG      = "#FEFCF8";
const TC      = "#C0401E";
const TC_SOFT = "#DE6A40";
const INK     = "#1C1208";
const INK_MUTED = "rgba(28,18,8,0.38)";
const INK_HAIR = "rgba(28,18,8,0.07)";
const SUCCESS = "#15803D";
const CARD    = "#FFF9EE";

export default function DriverLayout() {
  const { user, logout } = useAuthStore();
  const { isOnline } = useDriverStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column",
      maxWidth: 520, margin: "0 auto", position: "relative" }}>
      {/* Top status bar */}
      <div style={{ background: isOnline ? `linear-gradient(135deg, #15803D, #166534)` : "#1C1208",
        padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50, transition: "background 0.4s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#FFF5E6",
            fontStyle: "italic" }}>f</div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
              Driver App
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 999,
            background: isOnline ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%",
              background: isOnline ? "#4ADE80" : "#94A3B8",
              boxShadow: isOnline ? "0 0 0 3px rgba(74,222,128,0.3)" : "none",
              animation: isOnline ? "pulse-dot 2s infinite" : "none" }} />
            <span style={{ fontSize: "0.72rem", color: isOnline ? "#4ADE80" : "rgba(255,255,255,0.4)",
              fontWeight: 700, letterSpacing: "0.06em" }}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#FFF5E6", fontSize: "0.78rem", fontWeight: 700 }}>
            {user?.name?.charAt(0)?.toUpperCase() || "D"}
          </div>
        </div>
      </div>

      {/* Page content */}
      <main style={{ flex: 1, padding: "0 0 80px 0" }}>
        <Outlet />
      </main>

      {/* Bottom nav bar — mobile style */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 520, background: "#FFF",
        borderTop: `1px solid ${INK_HAIR}`,
        display: "flex", zIndex: 50,
        boxShadow: "0 -4px 20px rgba(28,18,8,0.08)" }}>
        {[
          { to: "/driver",         label: "Home",    Icon: Home },
          { to: "/driver/history", label: "History", Icon: History },
        ].map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === "/driver"}
            style={({ isActive }) => ({
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "10px 0 8px",
              textDecoration: "none", gap: 4,
              color: isActive ? TC : INK_MUTED,
              borderTop: `2px solid ${isActive ? TC : "transparent"}`,
              transition: "all 0.15s",
            })}>
            {({ isActive }) => (<>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ fontSize: "0.7rem", fontWeight: isActive ? 700 : 500,
                fontFamily: "var(--font-sans)" }}>{label}</span>
            </>)}
          </NavLink>
        ))}
        <button onClick={handleLogout} style={{ flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "10px 0 8px",
          background: "none", border: "none", cursor: "pointer", gap: 4,
          color: "#FC8181", borderTop: "2px solid transparent" }}>
          <LogOut size={22} strokeWidth={1.8} />
          <span style={{ fontSize: "0.7rem", fontWeight: 500, fontFamily: "var(--font-sans)" }}>Sign out</span>
        </button>
      </div>

      <style>{`
        @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.4)}50%{box-shadow:0 0 0 5px rgba(74,222,128,0)} }
      `}</style>
    </div>
  );
}
