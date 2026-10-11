import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ShoppingBag, Clock, ChefHat, ArrowRight, ToggleLeft, ToggleRight, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useOwnerStore } from "../../store/ownerStore";
import { useAuthStore } from "../../store/authStore";

const INK      = "#1C1208";
const INK_SOFT = "rgba(28,18,8,0.6)";
const INK_MUTED = "rgba(28,18,8,0.38)";
const INK_HAIR = "rgba(28,18,8,0.07)";
const CARD     = "#FFF9EE";
const CARD2    = "#F5ECD8";
const TC       = "#C0401E";
const TC_SOFT  = "#DE6A40";
const SUCCESS  = "#15803D";
const SAFFRON  = "#D4882A";
const PISTACHIO= "#5A7040";

export default function OwnerOverview() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    restaurants, currentRestaurant, menuItems, orders, activeOrders,
    loading, fetchMyRestaurants, fetchMenu, fetchOrders, fetchActiveOrders, toggleOpen,
  } = useOwnerStore();

  useEffect(() => {
    fetchMyRestaurants().then(list => {
      if (list?.length) {
        const id = list[0].restaurantId;
        fetchMenu(id).catch(() => {});
        fetchOrders(id).catch(() => {});
        fetchActiveOrders(id).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const handleToggleOpen = async () => {
    if (!currentRestaurant) return;
    try {
      const u = await toggleOpen(currentRestaurant.restaurantId);
      toast.success(u.isOpen ? "Restaurant is now open! 🟢" : "Restaurant closed 🔴");
    } catch { toast.error("Failed to update status"); }
  };

  if (loading && restaurants.length === 0) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", height:"60vh", gap:16, color:INK }}>
        <Loader2 size={32} style={{ color:TC_SOFT, animation:"spin 1s linear infinite" }} />
        <p style={{ color:INK_MUTED }}>Loading your restaurant...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // No restaurant yet — guide them to create one
  if (!loading && restaurants.length === 0) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"70vh" }}>
        <div style={{ textAlign:"center", maxWidth:480, color:INK }}>
          <div style={{ fontSize:"5rem", marginBottom:16 }}>🍽</div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"2.2rem", marginBottom:14, color:INK }}>
            Welcome, {user?.name ? user.name.split(" ")[0] : "Chef"}!
          </h1>
          <p style={{ color:INK_MUTED, lineHeight:1.8, marginBottom:36, fontSize:"1rem" }}>
            You don't have a restaurant registered yet.<br />
            Set up your restaurant to start receiving orders.
          </p>
          <button onClick={() => navigate("/owner/settings")} style={{
            display:"inline-flex", alignItems:"center", gap:10,
            padding:"14px 32px", borderRadius:14, border:"none",
            background:`linear-gradient(135deg,${TC_SOFT},${TC})`, color:"#FFF5E6",
            fontWeight:700, fontSize:"1rem", cursor:"pointer",
            boxShadow:`0 6px 24px ${TC}50`, fontFamily:"var(--font-sans)" }}>
            <Plus size={18} /> Register Your Restaurant
          </button>
        </div>
      </div>
    );
  }

  const delivered = orders.filter(o => ["DELIVERED","COMPLETED"].includes(o.status));
  const cancelled = orders.filter(o => o.status === "CANCELLED");
  const active    = orders.filter(o => !["DELIVERED","COMPLETED","CANCELLED"].includes(o.status));
  const revenue   = delivered.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0);
  const r         = currentRestaurant;
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  return (
    <div style={{ color:INK, animation:"fade-up 0.4s ease-out" }}>
      {/* Header */}
      <div style={{ marginBottom:36, display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <div>
          <p style={{ fontSize:"0.78rem", color:INK_MUTED, textTransform:"uppercase",
            letterSpacing:"0.12em", fontWeight:700, marginBottom:6 }}>Good {greeting}</p>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(1.8rem,3vw,2.8rem)",
            fontWeight:500, letterSpacing:"-0.03em", lineHeight:1 }}>
            {r?.name || "My Restaurant"}
          </h1>
          <p style={{ fontSize:"0.88rem", color:INK_MUTED, marginTop:8 }}>
            {r?.cuisineType} · {r?.address?.split(",")?.[0] || "—"}
          </p>
        </div>
        <button onClick={handleToggleOpen} style={{
          display:"flex", alignItems:"center", gap:10, padding:"12px 22px",
          borderRadius:12, border:"none", cursor:"pointer",
          fontFamily:"var(--font-sans)", fontSize:"0.9rem", fontWeight:700,
          background: r?.isOpen ? "linear-gradient(135deg,#16A34A,#15803D)"
            : `linear-gradient(135deg,${TC_SOFT},${TC})`,
          color:"#FFF5E6",
          boxShadow: r?.isOpen ? "0 4px 16px rgba(21,128,61,0.4)" : `0 4px 16px ${TC}50` }}>
          {r?.isOpen ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {r?.isOpen ? "Open for orders" : "Currently closed"}
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:36 }}>
        {[
          { label:"Revenue Today",  value:`₹${revenue.toFixed(0)}`,  Icon:TrendingUp, color:SAFFRON,  sub:`${delivered.length} orders delivered` },
          { label:"Active Orders",  value:active.length,              Icon:Clock,      color:"#7C3AED", sub:"Need attention" },
          { label:"Total Orders",   value:orders.length,              Icon:ShoppingBag,color:TC_SOFT,  sub:`${cancelled.length} cancelled` },
          { label:"Menu Items",     value:menuItems.length,           Icon:ChefHat,    color:PISTACHIO, sub:r?.isPureVeg ? "Pure Veg ✓" : "Veg + Non-veg" },
        ].map((s, i) => (
          <div key={i} style={{ background:CARD, borderRadius:16, padding:"22px 24px",
            border:`1px solid ${INK_HAIR}`,
            animation:`fade-up 0.4s ease-out ${i * 0.07}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:`${s.color}15`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <s.Icon size={18} style={{ color:s.color }} />
              </div>
              <span style={{ fontSize:"0.65rem", color:INK_MUTED, textTransform:"uppercase",
                letterSpacing:"0.1em", fontWeight:700, textAlign:"right" }}>{s.label}</span>
            </div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:"2.2rem", fontWeight:500,
              color:INK, lineHeight:1, marginBottom:6 }}>{s.value}</div>
            <div style={{ fontSize:"0.72rem", color:INK_MUTED }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* Active orders preview */}
        <div style={{ background:CARD, borderRadius:20, padding:"24px", border:`1px solid ${INK_HAIR}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.2rem", fontWeight:500, color:INK }}>
              Active Orders
            </h2>
            <button onClick={() => navigate("/owner/orders")} style={{ display:"flex", alignItems:"center",
              gap:4, background:"none", border:"none", cursor:"pointer",
              color:TC_SOFT, fontSize:"0.8rem", fontWeight:600, fontFamily:"var(--font-sans)" }}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          {activeOrders.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 0", color:INK_MUTED, fontSize:"0.88rem" }}>
              🎉 No pending orders right now
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {activeOrders.slice(0, 4).map(order => (
                <div key={order.orderId} style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", padding:"12px 16px",
                  background:CARD2, borderRadius:12,
                  border:`1px solid ${["PLACED","CREATED"].includes(order.status) ? TC + "30" : INK_HAIR}` }}>
                  <div>
                    <div style={{ fontSize:"0.88rem", fontWeight:700, color:INK }}>
                      #{order.orderId?.slice(-6)?.toUpperCase()}
                      {["PLACED","CREATED"].includes(order.status) && (
                        <span style={{ marginLeft:8, fontSize:"0.62rem", background:`${TC}18`,
                          color:TC, padding:"2px 7px", borderRadius:4,
                          fontWeight:800, textTransform:"uppercase" }}>NEW</span>
                      )}
                    </div>
                    <div style={{ fontSize:"0.72rem", color:INK_MUTED, marginTop:3 }}>
                      {order.items?.length || 0} items · ₹{parseFloat(order.totalAmount || 0).toFixed(0)}
                    </div>
                  </div>
                  <StatusPill status={order.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Restaurant info */}
        <div style={{ background:CARD, borderRadius:20, padding:"24px", border:`1px solid ${INK_HAIR}` }}>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.2rem", fontWeight:500,
            color:INK, marginBottom:20 }}>Restaurant Info</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {[
              { label:"Rating",        value: r?.avgRating > 0 ? `⭐ ${Number(r.avgRating).toFixed(1)}` : "No ratings yet" },
              { label:"Delivery time", value:`${r?.avgDeliveryTimeMins || "—"} mins` },
              { label:"Min. order",    value: r?.minOrderAmount > 0 ? `₹${r.minOrderAmount}` : "No minimum" },
              { label:"Phone",         value: r?.phone || "Not set" },
            ].map((f, i, arr) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"11px 0",
                borderBottom: i < arr.length - 1 ? `1px solid ${INK_HAIR}` : "none" }}>
                <span style={{ fontSize:"0.8rem", color:INK_MUTED, fontWeight:500 }}>{f.label}</span>
                <span style={{ fontSize:"0.88rem", color:INK, fontWeight:600 }}>{f.value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/owner/settings")} style={{ width:"100%", marginTop:20,
            padding:"10px", borderRadius:10, border:`1px solid ${INK_HAIR}`,
            background:"transparent", color:INK_SOFT, fontSize:"0.82rem", fontWeight:600,
            cursor:"pointer", fontFamily:"var(--font-sans)",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            Edit settings <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @media (max-width:900px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns:1fr!important; }
        }
      `}</style>
    </div>
  );
}

function StatusPill({ status }) {
  const MAP = {
    PLACED:    { label:"New",      bg:`${TC}12`, color:TC },
    CREATED:   { label:"New",      bg:`${TC}12`, color:TC },
    CONFIRMED: { label:"Accepted", bg:"#7C3AED15", color:"#7C3AED" },
    ACCEPTED:  { label:"Accepted", bg:"#7C3AED15", color:"#7C3AED" },
    PREPARING: { label:"Cooking",  bg:`${SAFFRON}15`, color:SAFFRON },
    READY:     { label:"Ready",    bg:`${SUCCESS}15`, color:SUCCESS },
  };
  const m = MAP[status] || { label:status, bg:"rgba(28,18,8,0.06)", color:"#1C1208" };
  return (
    <span style={{ padding:"4px 12px", borderRadius:999,
      background:m.bg, color:m.color, fontSize:"0.72rem", fontWeight:700 }}>
      {m.label}
    </span>
  );
}
