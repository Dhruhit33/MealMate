import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, ChefHat, Settings,
  LogOut, Menu, X, ChevronRight, Store
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useOwnerStore } from "../store/ownerStore";

/* ── Light-theme palette (matching Customer / Driver) ── */
const BG      = "#FEFCF8";
const SIDEBAR_BG = "#FFF9EE";
const BORDER  = "rgba(28,18,8,0.07)";
const MUTED   = "rgba(28,18,8,0.38)";
const SOFT    = "rgba(28,18,8,0.6)";
const INK     = "#1C1208";
const TC      = "#C0401E";
const TC_SOFT = "#DE6A40";
const SUCCESS = "#15803D";

const NAV_ITEMS = [
  { to: "/owner",          label: "Overview",  Icon: LayoutDashboard, end: true },
  { to: "/owner/orders",   label: "Orders",    Icon: ShoppingBag },
  { to: "/owner/menu",     label: "Menu",      Icon: ChefHat },
  { to: "/owner/settings", label: "Settings",  Icon: Settings },
];

export default function OwnerLayout() {
  const { user, logout }               = useAuthStore();
  const { currentRestaurant, restaurants, fetchMyRestaurants } = useOwnerStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load restaurants on mount
  useEffect(() => {
    fetchMyRestaurants().catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const SidebarContent = ({ mobile = false }) => (
    <>
      {/* Logo + collapse */}
      <div style={{ padding:"20px 16px", borderBottom:`1px solid ${BORDER}`,
        display:"flex", alignItems:"center", gap:10, minHeight:72 }}>
        <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
          background:`linear-gradient(135deg,${TC_SOFT},${TC})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"var(--font-display)", fontSize:"1.2rem", fontWeight:700,
          color:"#FFF5E6", fontStyle:"italic" }}>f</div>
        {(!collapsed || mobile) && (
          <div style={{ overflow:"hidden" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:"1.1rem", color:INK,
              letterSpacing:"-0.01em", lineHeight:1 }}>
              foodrush<span style={{ color:TC }}>.</span>
            </div>
            <div style={{ fontSize:"0.62rem", color:MUTED, textTransform:"uppercase",
              letterSpacing:"0.12em", fontWeight:700, marginTop:2 }}>Owner Portal</div>
          </div>
        )}
        {!mobile && (
          <button onClick={() => setCollapsed(c => !c)} style={{ marginLeft:"auto", flexShrink:0,
            background:"none", border:"none", cursor:"pointer", color:MUTED, padding:4,
            display:"flex", alignItems:"center" }}>
            <ChevronRight size={16} style={{ transform: collapsed ? "rotate(0)" : "rotate(180deg)", transition:"transform 0.25s" }} />
          </button>
        )}
      </div>

      {/* Restaurant badge */}
      {(!collapsed || mobile) && (
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${BORDER}` }}>
          {currentRestaurant ? (
            <>
              <div style={{ fontSize:"0.62rem", color:MUTED, textTransform:"uppercase",
                letterSpacing:"0.12em", fontWeight:700, marginBottom:4 }}>Active Restaurant</div>
              <div style={{ fontSize:"0.88rem", color:INK, fontWeight:600,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {currentRestaurant.name}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:4 }}>
                <div style={{ width:6, height:6, borderRadius:"50%",
                  background: currentRestaurant.isOpen ? SUCCESS : "#94A3B8" }} />
                <span style={{ fontSize:"0.7rem",
                  color: currentRestaurant.isOpen ? SUCCESS : MUTED, fontWeight:600 }}>
                  {currentRestaurant.isOpen ? "Open" : "Closed"}
                </span>
              </div>
            </>
          ) : (
            <div style={{ fontSize:"0.8rem", color:MUTED }}>No restaurant yet</div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display:"flex", alignItems:"center", gap:10,
              padding: collapsed && !mobile ? "12px 0" : "11px 12px",
              justifyContent: collapsed && !mobile ? "center" : "flex-start",
              borderRadius:10, marginBottom:2, textDecoration:"none",
              background: isActive ? `${TC}12` : "transparent",
              color: isActive ? TC : SOFT,
              fontFamily:"var(--font-sans)", fontSize:"0.88rem", fontWeight:600,
              transition:"all 0.15s",
              border:`1px solid ${isActive ? TC + "25" : "transparent"}`,
            })}>
            {({ isActive }) => (<>
              <Icon size={18} style={{ flexShrink:0, color: isActive ? TC : MUTED }} />
              {(!collapsed || mobile) && label}
            </>)}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding:"12px 8px", borderTop:`1px solid ${BORDER}` }}>
        {(!collapsed || mobile) && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
            borderRadius:10, marginBottom:6, background:"rgba(28,18,8,0.03)" }}>
            <div style={{ width:32, height:32, borderRadius:"50%",
              background:`linear-gradient(135deg,${TC_SOFT},${TC})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"#FFF5E6", fontSize:"0.82rem", fontWeight:700, flexShrink:0 }}>
              {user?.name?.charAt(0)?.toUpperCase() || "O"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"0.82rem", color:INK, fontWeight:600,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user?.name || "Owner"}
              </div>
              <div style={{ fontSize:"0.68rem", color:MUTED }}>Restaurant Owner</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} style={{ width:"100%", display:"flex", alignItems:"center",
          gap:10, padding: collapsed && !mobile ? "12px 0" : "10px 12px",
          justifyContent: collapsed && !mobile ? "center" : "flex-start",
          borderRadius:10, border:"none", background:"transparent", cursor:"pointer",
          color:"#DC2626", fontFamily:"var(--font-sans)", fontSize:"0.85rem", fontWeight:600,
          transition:"background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.06)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <LogOut size={16} style={{ flexShrink:0 }} />
          {(!collapsed || mobile) && "Sign out"}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:BG }}>
      {/* Desktop sidebar */}
      <aside className="hide-mobile" style={{ width: collapsed ? 72 : 240, background:SIDEBAR_BG,
        borderRight:`1px solid ${BORDER}`, display:"flex", flexDirection:"column",
        height:"100vh", flexShrink:0, transition:"width 0.25s ease",
        position:"sticky", top:0 }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position:"fixed", inset:0,
            background:"rgba(0,0,0,0.3)", zIndex:299, backdropFilter:"blur(4px)" }} />
          <aside style={{ position:"fixed", top:0, left:0, width:280, height:"100vh",
            background:SIDEBAR_BG, borderRight:`1px solid ${BORDER}`,
            display:"flex", flexDirection:"column", zIndex:300 }}>
            <SidebarContent mobile />
          </aside>
        </>
      )}

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        {/* Mobile top bar */}
        <div className="hide-desktop" style={{ height:56, background:SIDEBAR_BG,
          borderBottom:`1px solid ${BORDER}`, display:"flex", alignItems:"center",
          padding:"0 16px", gap:12 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background:"none", border:"none",
            cursor:"pointer", color:SOFT, display:"flex", padding:4 }}>
            <Menu size={22} />
          </button>
          <div style={{ fontFamily:"var(--font-display)", fontSize:"1.1rem", color:INK }}>
            {currentRestaurant?.name || "Owner Dashboard"}
          </div>
        </div>

        <main style={{ flex:1, padding:"32px 36px", overflowY:"auto" }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width:768px) {
          .hide-mobile { display:none!important; }
          main { padding:20px 16px!important; }
        }
        @media (min-width:769px) {
          .hide-desktop { display:none!important; }
        }
      `}</style>
    </div>
  );
}
