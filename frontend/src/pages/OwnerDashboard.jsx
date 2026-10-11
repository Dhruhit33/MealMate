import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Store, ShoppingBag, ChefHat, BarChart2, PlusCircle, ToggleLeft,
  ToggleRight, Clock, CheckCircle, XCircle, Edit2, Trash2,
  Loader2, RefreshCw, TrendingUp, Users, Star, Package,
  AlertCircle, Plus, X, Flame, Eye
} from "lucide-react";
import { useOwnerStore } from "../store/ownerStore";
import { useAuthStore } from "../store/authStore";

// ─── Design tokens (matches FoodRush palette) ──────────────────────────────
const INK        = "#1C1208";
const INK_SOFT   = "rgba(28,18,8,0.58)";
const INK_MUTED  = "rgba(28,18,8,0.38)";
const INK_HAIR   = "rgba(28,18,8,0.07)";
const CREAM      = "#FEFCF8";
const CARD       = "#FFF9EE";
const FIELD      = "#F5ECD8";
const TC         = "#C0401E";
const TC_SOFT    = "#DE6A40";
const TC_DEEP    = "#8B2910";
const SAFFRON    = "#D4882A";
const PISTACHIO  = "#5A7040";
const SUCCESS    = "#15803D";
const DANGER     = "#DC2626";

const STATUS_META = {
  PLACED:           { label: "New Order",        color: "#1D4ED8", bg: "#EFF6FF"  },
  CREATED:          { label: "New Order",        color: "#1D4ED8", bg: "#EFF6FF"  },
  CONFIRMED:        { label: "Confirmed",        color: "#6D28D9", bg: "#F5F3FF"  },
  ACCEPTED:         { label: "Accepted",         color: "#6D28D9", bg: "#F5F3FF"  },
  PREPARING:        { label: "Preparing",        color: SAFFRON,  bg: "#FFFBEB"  },
  READY:            { label: "Ready",            color: SUCCESS,  bg: "#ECFDF5"  },
  PICKED_UP:        { label: "Picked Up",        color: TC,       bg: `${TC}12`  },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: TC,       bg: `${TC}12`  },
  DELIVERED:        { label: "Delivered",        color: SUCCESS,  bg: "#ECFDF5"  },
  COMPLETED:        { label: "Completed",        color: SUCCESS,  bg: "#ECFDF5"  },
  CANCELLED:        { label: "Cancelled",        color: DANGER,   bg: "#FEF2F2"  },
};

const TABS = [
  { id: "overview",  label: "Overview",      Icon: BarChart2   },
  { id: "orders",    label: "Orders",        Icon: ShoppingBag  },
  { id: "menu",      label: "Menu",          Icon: ChefHat      },
  { id: "settings",  label: "Settings",      Icon: Store        },
];

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const {
    restaurants, currentRestaurant, menuItems, categories, orders,
    activeOrders, loading, menuLoading, ordersLoading,
    fetchMyRestaurants, fetchMenu, fetchOrders, fetchActiveOrders,
    toggleOpen, selectRestaurant,
  } = useOwnerStore();

  const [tab, setTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    fetchMyRestaurants().catch(() => {});
  }, []);

  // Load restaurant data when current changes
  useEffect(() => {
    if (!currentRestaurant?.restaurantId) return;
    const id = currentRestaurant.restaurantId;
    fetchMenu(id);
    fetchOrders(id);
    fetchActiveOrders(id);
  }, [currentRestaurant?.restaurantId]);

  // Auto-refresh active orders every 30s
  useEffect(() => {
    if (!currentRestaurant?.restaurantId) return;
    const t = setInterval(() => {
      fetchActiveOrders(currentRestaurant.restaurantId);
    }, 30000);
    return () => clearInterval(t);
  }, [currentRestaurant?.restaurantId]);

  const handleRefresh = async () => {
    if (!currentRestaurant?.restaurantId) return;
    setRefreshing(true);
    const id = currentRestaurant.restaurantId;
    await Promise.all([fetchOrders(id), fetchActiveOrders(id)]);
    setRefreshing(false);
    toast.success("Refreshed!");
  };

  const handleToggleOpen = async () => {
    if (!currentRestaurant) return;
    try {
      const updated = await toggleOpen(currentRestaurant.restaurantId);
      toast.success(updated.isOpen ? "Restaurant is now open! 🟢" : "Restaurant is now closed 🔴");
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading && restaurants.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 16 }}>
        <Loader2 size={32} style={{ color: TC, animation: "spin 1s linear infinite" }} />
        <p style={{ color: INK_SOFT, fontSize: "0.9rem" }}>Loading your restaurant...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return <NoRestaurantView />;
  }

  return (
    <div style={{ paddingBottom: 80, animation: "fade-up 0.4s ease-out" }}>
      {/* ── Top header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: currentRestaurant?.isOpen ? SUCCESS : DANGER,
                boxShadow: currentRestaurant?.isOpen ? `0 0 0 3px ${SUCCESS}30` : "none",
                animation: currentRestaurant?.isOpen ? "pulse-dot 2s ease-in-out infinite" : "none" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
                color: currentRestaurant?.isOpen ? SUCCESS : INK_MUTED }}>
                {currentRestaurant?.isOpen ? "Open for orders" : "Closed"}
              </span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,4vw,2.8rem)",
              fontWeight: 500, letterSpacing: "-0.03em", color: INK, lineHeight: 1 }}>
              {currentRestaurant?.name || "My Restaurant"}
            </h1>
            <p style={{ fontSize: "0.9rem", color: INK_SOFT, marginTop: 6 }}>
              {currentRestaurant?.cuisineType} · {currentRestaurant?.address?.split(",")[0]}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Refresh */}
            <button onClick={handleRefresh} disabled={refreshing} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10,
              border: `1.5px solid ${INK_HAIR}`, background: CARD, cursor: "pointer",
              fontSize: "0.82rem", fontWeight: 600, color: INK_SOFT, fontFamily: "var(--font-sans)",
            }}>
              <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>

            {/* Toggle open */}
            <button onClick={handleToggleOpen} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10,
              border: "none", cursor: "pointer", fontFamily: "var(--font-sans)",
              fontSize: "0.85rem", fontWeight: 700,
              background: currentRestaurant?.isOpen
                ? `linear-gradient(135deg,#16A34A,${SUCCESS})`
                : `linear-gradient(135deg,${TC_SOFT},${TC})`,
              color: "#FFF5E6",
              boxShadow: currentRestaurant?.isOpen ? `0 4px 14px ${SUCCESS}45` : `0 4px 14px ${TC}45`,
            }}>
              {currentRestaurant?.isOpen
                ? <><ToggleRight size={16} /> Open</>
                : <><ToggleLeft size={16} /> Closed</>}
            </button>
          </div>
        </div>

        {/* Multiple restaurants selector */}
        {restaurants.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {restaurants.map((r) => (
              <button key={r.restaurantId} onClick={() => selectRestaurant(r)} style={{
                padding: "6px 14px", borderRadius: 999, border: `1.5px solid`,
                borderColor: currentRestaurant?.restaurantId === r.restaurantId ? TC : INK_HAIR,
                background: currentRestaurant?.restaurantId === r.restaurantId ? TC : CARD,
                color: currentRestaurant?.restaurantId === r.restaurantId ? "#FFF5E6" : INK_SOFT,
                fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
              }}>
                {r.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Nav tabs ── */}
      <div style={{ display: "flex", gap: 2, borderBottom: `2px solid ${INK_HAIR}`, marginBottom: 32 }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "11px 18px",
            border: "none", background: "none", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: "0.88rem", fontWeight: 600,
            color: tab === id ? TC : INK_MUTED,
            borderBottom: `2px solid ${tab === id ? TC : "transparent"}`,
            marginBottom: -2, transition: "all 0.15s",
          }}>
            <Icon size={15} /> {label}
            {id === "orders" && activeOrders.length > 0 && (
              <span style={{ minWidth: 18, height: 18, borderRadius: 999, background: TC,
                color: "#FFF5E6", fontSize: "0.65rem", fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                {activeOrders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}
      {tab === "overview" && <OverviewTab restaurant={currentRestaurant} orders={orders} menuItems={menuItems} />}
      {tab === "orders"   && <OrdersTab restaurant={currentRestaurant} activeOrders={activeOrders} orders={orders} loading={ordersLoading} onRefresh={handleRefresh} />}
      {tab === "menu"     && <MenuTab restaurant={currentRestaurant} menuItems={menuItems} categories={categories} loading={menuLoading} />}
      {tab === "settings" && <SettingsTab restaurant={currentRestaurant} />}

      <style>{`
        @keyframes fade-up   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100%{opacity:1;box-shadow:0 0 0 0 ${SUCCESS}99} 50%{opacity:.7;box-shadow:0 0 0 6px ${SUCCESS}00} }
        @keyframes slide-in  { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════
function OverviewTab({ restaurant, orders, menuItems }) {
  const delivered  = orders.filter((o) => ["DELIVERED","COMPLETED"].includes(o.status));
  const cancelled  = orders.filter((o) => o.status === "CANCELLED");
  const revenue    = delivered.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
  const active     = orders.filter((o) => !["DELIVERED","COMPLETED","CANCELLED"].includes(o.status));

  const stats = [
    { label: "Total Revenue",   value: `₹${revenue.toFixed(0)}`,  icon: TrendingUp, color: SAFFRON   },
    { label: "Orders Today",    value: orders.length,               icon: ShoppingBag, color: TC       },
    { label: "Active Orders",   value: active.length,              icon: Clock,      color: "#6D28D9"  },
    { label: "Menu Items",      value: menuItems.length,           icon: ChefHat,    color: PISTACHIO  },
  ];

  return (
    <div style={{ animation: "fade-up 0.3s ease-out" }}>
      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 40 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: CARD, borderRadius: 18, padding: "22px 24px",
            border: `1px solid ${INK_HAIR}`,
            boxShadow: `0 2px 12px rgba(28,18,8,0.04)`,
            animation: `fade-up 0.4s ease-out ${i * 0.06}s both`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: INK_MUTED }}>
                {s.label}
              </span>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: `${s.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 500,
              color: INK, lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Restaurant info card */}
      <div style={{ background: CARD, borderRadius: 20, padding: "28px", border: `1px solid ${INK_HAIR}`, marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 500,
          color: INK, marginBottom: 20 }}>
          Restaurant Details
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
          {[
            { label: "Cuisine",       value: restaurant?.cuisineType || "—" },
            { label: "Rating",        value: restaurant?.avgRating > 0 ? `${Number(restaurant.avgRating).toFixed(1)} ★` : "No ratings yet" },
            { label: "Delivery Time", value: `${restaurant?.avgDeliveryTimeMins || 30} mins` },
            { label: "Min. Order",    value: restaurant?.minOrderAmount > 0 ? `₹${restaurant.minOrderAmount}` : "No minimum" },
            { label: "Delivery Fee",  value: restaurant?.deliveryFee > 0 ? `₹${restaurant.deliveryFee}` : "Free" },
            { label: "Pure Veg",      value: restaurant?.isPureVeg ? "Yes 🌿" : "No" },
          ].map((f, i) => (
            <div key={i} style={{ padding: "14px 18px", background: FIELD, borderRadius: 12 }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 6 }}>
                {f.label}
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: INK }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      {orders.length > 0 && (
        <div style={{ background: CARD, borderRadius: 20, padding: "28px", border: `1px solid ${INK_HAIR}` }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 500,
            color: INK, marginBottom: 20 }}>
            Recent Orders
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.slice(0, 5).map((order) => {
              const meta = STATUS_META[order.status] || STATUS_META.PLACED;
              return (
                <div key={order.orderId} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", background: FIELD, borderRadius: 12,
                }}>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: INK }}>
                      Order #{order.orderId?.slice(-6)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: INK_MUTED, marginTop: 2 }}>
                      {order.items?.length || 0} items · ₹{parseFloat(order.totalAmount || 0).toFixed(0)}
                    </div>
                  </div>
                  <span style={{ padding: "4px 12px", borderRadius: 999,
                    background: meta.bg, color: meta.color, fontSize: "0.72rem", fontWeight: 700 }}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ORDERS TAB
// ═══════════════════════════════════════════════════════════════════════════
function OrdersTab({ restaurant, activeOrders, orders, loading, onRefresh }) {
  const [activeTab, setActiveTab] = useState("active");
  const { acceptOrder, updateOrderStatus } = useOwnerStore();
  const [actionLoading, setActionLoading] = useState({});

  const past = orders.filter((o) => ["DELIVERED","COMPLETED","CANCELLED"].includes(o.status));

  const handleAccept = async (order) => {
    setActionLoading((p) => ({ ...p, [order.orderId]: true }));
    try {
      await acceptOrder(restaurant.restaurantId, order.orderId, 25);
      toast.success("Order accepted! 🎉");
    } catch {
      toast.error("Failed to accept order");
    }
    setActionLoading((p) => ({ ...p, [order.orderId]: false }));
  };

  const handleStatus = async (orderId, status) => {
    setActionLoading((p) => ({ ...p, [orderId]: true }));
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order marked as ${STATUS_META[status]?.label || status}`);
    } catch {
      toast.error("Failed to update order");
    }
    setActionLoading((p) => ({ ...p, [orderId]: false }));
  };

  const NEXT_STATUS = {
    PLACED:    { label: "Accept",      status: "CONFIRMED",  color: TC },
    CREATED:   { label: "Accept",      status: "CONFIRMED",  color: TC },
    CONFIRMED: { label: "Start Prep",  status: "PREPARING",  color: SAFFRON },
    ACCEPTED:  { label: "Start Prep",  status: "PREPARING",  color: SAFFRON },
    PREPARING: { label: "Mark Ready",  status: "READY",      color: SUCCESS },
  };

  if (loading && activeOrders.length === 0 && orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px", color: INK_MUTED }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
        Loading orders...
      </div>
    );
  }

  return (
    <div style={{ animation: "fade-up 0.3s ease-out" }}>
      {/* Sub tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          { id: "active", label: `Active (${activeOrders.length})` },
          { id: "history", label: `History (${past.length})` },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            padding: "8px 18px", borderRadius: 999,
            border: `1.5px solid ${activeTab === id ? TC : INK_HAIR}`,
            background: activeTab === id ? TC : CARD,
            color: activeTab === id ? "#FFF5E6" : INK_SOFT,
            fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
          }}>
            {label}
          </button>
        ))}
        <button onClick={onRefresh} style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 999, border: `1.5px solid ${INK_HAIR}`,
          background: CARD, cursor: "pointer", fontSize: "0.8rem", color: INK_SOFT,
        }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {activeTab === "active" && (
        <>
          {activeOrders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No active orders" subtitle="New orders will appear here in real-time" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {activeOrders.map((order) => {
                const meta  = STATUS_META[order.status] || STATUS_META.PLACED;
                const next  = NEXT_STATUS[order.status];
                const isLoading = actionLoading[order.orderId];

                return (
                  <div key={order.orderId} style={{
                    background: CARD, borderRadius: 18, padding: "22px 24px",
                    border: `1px solid ${INK_HAIR}`,
                    boxShadow: order.status === "PLACED" || order.status === "CREATED"
                      ? `0 0 0 2px ${TC}30, 0 8px 24px rgba(28,18,8,0.08)` : `0 2px 12px rgba(28,18,8,0.04)`,
                    animation: "slide-in 0.3s ease-out",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: INK }}>
                            Order #{order.orderId?.slice(-6).toUpperCase()}
                          </span>
                          {(order.status === "PLACED" || order.status === "CREATED") && (
                            <span style={{ padding: "3px 8px", borderRadius: 4, background: `${TC}15`,
                              color: TC_DEEP, fontSize: "0.62rem", fontWeight: 800,
                              textTransform: "uppercase", letterSpacing: "0.1em" }}>
                              NEW
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: INK_MUTED }}>
                          {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          {order.estimatedDeliveryMins && ` · Est. ${order.estimatedDeliveryMins} mins`}
                        </div>
                      </div>
                      <span style={{ padding: "5px 14px", borderRadius: 999, background: meta.bg,
                        color: meta.color, fontSize: "0.75rem", fontWeight: 700 }}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Items */}
                    <div style={{ background: FIELD, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
                      {(order.items || []).map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between",
                          fontSize: "0.85rem", color: INK, padding: "4px 0",
                          borderBottom: i < order.items.length - 1 ? `1px solid ${INK_HAIR}` : "none" }}>
                          <span>{item.quantity}× {item.itemName || item.name}</span>
                          <span style={{ color: INK_SOFT }}>₹{parseFloat(item.price || 0) * item.quantity}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between",
                        fontSize: "0.9rem", fontWeight: 700, color: INK, marginTop: 10,
                        paddingTop: 10, borderTop: `1.5px solid ${INK_HAIR}` }}>
                        <span>Total</span>
                        <span style={{ color: TC }}>₹{parseFloat(order.totalAmount || 0).toFixed(0)}</span>
                      </div>
                    </div>

                    {order.specialInstructions && (
                      <div style={{ padding: "10px 14px", background: `${SAFFRON}10`, borderRadius: 10,
                        fontSize: "0.82rem", color: INK_SOFT, marginBottom: 16,
                        border: `1px solid ${SAFFRON}25` }}>
                        📝 {order.specialInstructions}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10 }}>
                      {next && (
                        <button onClick={() =>
                          order.status === "PLACED" || order.status === "CREATED"
                            ? handleAccept(order)
                            : handleStatus(order.orderId, next.status)
                        }
                          disabled={isLoading}
                          style={{
                            flex: 1, padding: "11px", borderRadius: 12, border: "none",
                            background: `linear-gradient(135deg,${next.color},${next.color}dd)`,
                            color: "#FFF5E6", fontWeight: 700, fontSize: "0.88rem",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            fontFamily: "var(--font-sans)",
                            opacity: isLoading ? 0.7 : 1,
                          }}>
                          {isLoading
                            ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                            : <CheckCircle size={15} />}
                          {next.label}
                        </button>
                      )}
                      {(order.status === "PLACED" || order.status === "CREATED") && (
                        <button onClick={() => handleStatus(order.orderId, "CANCELLED")}
                          disabled={isLoading}
                          style={{
                            padding: "11px 18px", borderRadius: 12,
                            border: `1.5px solid ${DANGER}30`, background: "#FEF2F2",
                            color: DANGER, fontWeight: 600, fontSize: "0.85rem",
                            cursor: "pointer", fontFamily: "var(--font-sans)",
                          }}>
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "history" && (
        <>
          {past.length === 0 ? (
            <EmptyState icon={Clock} title="No order history" subtitle="Completed and cancelled orders will appear here" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {past.map((order) => {
                const meta = STATUS_META[order.status] || STATUS_META.DELIVERED;
                return (
                  <div key={order.orderId} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: CARD, borderRadius: 14, padding: "16px 20px",
                    border: `1px solid ${INK_HAIR}`,
                  }}>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: INK }}>
                        #{order.orderId?.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: INK_MUTED, marginTop: 2 }}>
                        {order.items?.length || 0} items · {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem",
                        color: order.status === "CANCELLED" ? INK_MUTED : TC }}>
                        ₹{parseFloat(order.totalAmount || 0).toFixed(0)}
                      </span>
                      <span style={{ padding: "4px 12px", borderRadius: 999, background: meta.bg,
                        color: meta.color, fontSize: "0.72rem", fontWeight: 700 }}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU TAB
// ═══════════════════════════════════════════════════════════════════════════
function MenuTab({ restaurant, menuItems, categories, loading }) {
  const { addMenuItem, updateMenuItem, toggleItemAvailability, deleteMenuItem, addCategory } = useOwnerStore();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [actionLoading, setActionLoading] = useState({});

  const filtered = filterCat === "all"
    ? menuItems
    : menuItems.filter((i) => i.categoryId === filterCat || i.category?.categoryId === filterCat);

  const handleToggleAvail = async (item) => {
    setActionLoading((p) => ({ ...p, [item.itemId]: true }));
    try {
      await toggleItemAvailability(restaurant.restaurantId, item.itemId);
    } catch {
      toast.error("Failed to update");
    }
    setActionLoading((p) => ({ ...p, [item.itemId]: false }));
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await deleteMenuItem(restaurant.restaurantId, item.itemId);
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px", color: INK_MUTED }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
        Loading menu...
      </div>
    );
  }

  return (
    <div style={{ animation: "fade-up 0.3s ease-out" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setFilterCat("all")} style={{
            padding: "6px 14px", borderRadius: 999, border: `1.5px solid ${filterCat === "all" ? TC : INK_HAIR}`,
            background: filterCat === "all" ? TC : CARD, color: filterCat === "all" ? "#FFF5E6" : INK_SOFT,
            fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
          }}>All</button>
          {categories.map((cat) => (
            <button key={cat.categoryId} onClick={() => setFilterCat(cat.categoryId)} style={{
              padding: "6px 14px", borderRadius: 999, border: `1.5px solid ${filterCat === cat.categoryId ? TC : INK_HAIR}`,
              background: filterCat === cat.categoryId ? TC : CARD,
              color: filterCat === cat.categoryId ? "#FFF5E6" : INK_SOFT,
              fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
            }}>{cat.name}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowAddCat(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
            border: `1.5px solid ${INK_HAIR}`, background: CARD, cursor: "pointer",
            fontSize: "0.8rem", fontWeight: 600, color: INK_SOFT,
          }}>
            <Plus size={13} /> Category
          </button>
          <button onClick={() => { setEditItem(null); setShowAddItem(true); }} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
            border: "none", background: `linear-gradient(135deg,${TC_SOFT},${TC})`,
            cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, color: "#FFF5E6",
            boxShadow: `0 4px 14px ${TC}35`,
          }}>
            <PlusCircle size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Items grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={ChefHat} title="No menu items" subtitle="Add your first menu item to get started" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {filtered.map((item) => (
            <div key={item.itemId} style={{
              background: CARD, borderRadius: 16, border: `1px solid ${INK_HAIR}`,
              overflow: "hidden", opacity: item.isAvailable === false ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}>
              {item.imageUrl && (
                <div style={{ height: 140, background: `url(${item.imageUrl}) center/cover`, position: "relative" }}>
                  {item.isAvailable === false && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(28,18,8,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#FFF5E6", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.06em" }}>
                      UNAVAILABLE
                    </div>
                  )}
                </div>
              )}
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: INK }}>{item.name}</div>
                    {item.description && (
                      <div style={{ fontSize: "0.75rem", color: INK_MUTED, marginTop: 2,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                    {item.isVeg !== undefined && (
                      <span style={{ width: 14, height: 14, borderRadius: 2,
                        border: `1.5px solid ${item.isVeg ? PISTACHIO : DANGER}`,
                        display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%",
                          background: item.isVeg ? PISTACHIO : DANGER }} />
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: TC }}>
                    ₹{parseFloat(item.price || 0).toFixed(0)}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleToggleAvail(item)} disabled={actionLoading[item.itemId]}
                      title={item.isAvailable === false ? "Mark available" : "Mark unavailable"}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${INK_HAIR}`,
                        background: FIELD, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      {actionLoading[item.itemId]
                        ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                        : item.isAvailable === false
                          ? <Eye size={13} style={{ color: SUCCESS }} />
                          : <Eye size={13} style={{ color: INK_MUTED }} />}
                    </button>
                    <button onClick={() => { setEditItem(item); setShowAddItem(true); }}
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${INK_HAIR}`,
                        background: FIELD, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Edit2 size={13} style={{ color: INK_MUTED }} />
                    </button>
                    <button onClick={() => handleDelete(item)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${DANGER}20`,
                        background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={13} style={{ color: DANGER }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddItem && (
        <MenuItemModal
          item={editItem}
          categories={categories}
          restaurantId={restaurant?.restaurantId}
          onClose={() => { setShowAddItem(false); setEditItem(null); }}
          onSave={async (data) => {
            if (editItem) {
              await updateMenuItem(restaurant.restaurantId, editItem.itemId, data);
              toast.success("Item updated!");
            } else {
              await addMenuItem(restaurant.restaurantId, data);
              toast.success("Item added!");
            }
            setShowAddItem(false);
            setEditItem(null);
          }}
        />
      )}
      {showAddCat && (
        <CategoryModal
          restaurantId={restaurant?.restaurantId}
          onClose={() => setShowAddCat(false)}
          onSave={async (data) => {
            await addCategory(restaurant.restaurantId, data);
            toast.success("Category added!");
            setShowAddCat(false);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════════════════════════════════
function SettingsTab({ restaurant }) {
  const { updateRestaurant } = useOwnerStore();
  const [form, setForm] = useState({
    name: restaurant?.name || "",
    description: restaurant?.description || "",
    cuisineType: restaurant?.cuisineType || "",
    address: restaurant?.address || "",
    phone: restaurant?.phone || "",
    minOrderAmount: restaurant?.minOrderAmount || 0,
    deliveryFee: restaurant?.deliveryFee || 30,
    avgDeliveryTimeMins: restaurant?.avgDeliveryTimeMins || 30,
    isPureVeg: restaurant?.isPureVeg || false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (restaurant) setForm({
      name: restaurant.name || "",
      description: restaurant.description || "",
      cuisineType: restaurant.cuisineType || "",
      address: restaurant.address || "",
      phone: restaurant.phone || "",
      minOrderAmount: restaurant.minOrderAmount || 0,
      deliveryFee: restaurant.deliveryFee || 30,
      avgDeliveryTimeMins: restaurant.avgDeliveryTimeMins || 30,
      isPureVeg: restaurant.isPureVeg || false,
    });
  }, [restaurant?.restaurantId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRestaurant(restaurant.restaurantId, form);
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  const Field = ({ label, name, type = "text", ...props }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 8 }}>
        {label}
      </label>
      <input type={type} value={form[name] || ""} onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
        {...props}
        style={{ width: "100%", padding: "11px 14px", background: FIELD, borderRadius: 10,
          border: `1.5px solid transparent`, outline: "none", fontSize: "0.9rem",
          fontFamily: "var(--font-sans)", color: INK, boxSizing: "border-box",
          transition: "border-color 0.2s",
          ...(props.style || {}),
        }}
        onFocus={(e) => e.target.style.borderColor = TC}
        onBlur={(e) => e.target.style.borderColor = "transparent"}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 640, animation: "fade-up 0.3s ease-out" }}>
      <div style={{ background: CARD, borderRadius: 20, padding: "28px", border: `1px solid ${INK_HAIR}` }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 500, color: INK, marginBottom: 24 }}>
          Restaurant Settings
        </h2>
        <Field label="Restaurant Name" name="name" placeholder="e.g. Sharma's Kitchen" />
        <Field label="Description" name="description" placeholder="Brief description of your restaurant" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Cuisine Type" name="cuisineType" placeholder="e.g. North Indian" />
          <Field label="Phone" name="phone" placeholder="+91..." />
        </div>
        <Field label="Address" name="address" placeholder="Full address" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <Field label="Min. Order (₹)" name="minOrderAmount" type="number" />
          <Field label="Delivery Fee (₹)" name="deliveryFee" type="number" />
          <Field label="Delivery Time (mins)" name="avgDeliveryTimeMins" type="number" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button onClick={() => setForm((p) => ({ ...p, isPureVeg: !p.isPureVeg }))}
            style={{
              width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer",
              background: form.isPureVeg ? PISTACHIO : INK_HAIR,
              position: "relative", transition: "background 0.2s",
            }}>
            <span style={{
              position: "absolute", top: 3, left: form.isPureVeg ? 22 : 3,
              width: 18, height: 18, borderRadius: "50%", background: "#FFF",
              transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }} />
          </button>
          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: INK }}>Pure Vegetarian</span>
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          width: "100%", padding: "13px", borderRadius: 12, border: "none",
          background: `linear-gradient(135deg,${TC_SOFT},${TC})`,
          color: "#FFF5E6", fontWeight: 700, fontSize: "0.92rem",
          cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: `0 4px 16px ${TC}35`, opacity: saving ? 0.7 : 1,
        }}>
          {saving && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
          Save Settings
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════════════
function MenuItemModal({ item, categories, restaurantId, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || "",
    categoryId: item?.categoryId || item?.category?.categoryId || "",
    isVeg: item?.isVeg ?? true,
    isBestSeller: item?.isBestSeller ?? false,
    imageUrl: item?.imageUrl || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error("Name and price are required"); return; }
    setSaving(true);
    try {
      await onSave({ ...form, price: parseFloat(form.price) });
    } catch {
      toast.error("Failed to save item");
    }
    setSaving(false);
  };

  return (
    <Modal title={item ? "Edit Item" : "Add Menu Item"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <ModalField label="Item Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Butter Chicken" />
        <ModalField label="Description" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Short description" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <ModalField label="Price (₹)" value={form.price} onChange={(v) => setForm((p) => ({ ...p, price: v }))} type="number" placeholder="0" />
          <div>
            <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 6 }}>
              Category
            </label>
            <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", background: FIELD, borderRadius: 10,
                border: "1.5px solid transparent", fontSize: "0.88rem", color: INK,
                fontFamily: "var(--font-sans)", outline: "none", cursor: "pointer" }}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <ModalField label="Image URL" value={form.imageUrl} onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))} placeholder="https://..." />
        <div style={{ display: "flex", gap: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm((p) => ({ ...p, isVeg: e.target.checked }))} />
            <span style={{ fontSize: "0.85rem", color: INK }}>Vegetarian 🌿</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.isBestSeller} onChange={(e) => setForm((p) => ({ ...p, isBestSeller: e.target.checked }))} />
            <span style={{ fontSize: "0.85rem", color: INK }}>Best Seller 🔥</span>
          </label>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10,
          border: `1.5px solid ${INK_HAIR}`, background: CARD, cursor: "pointer",
          fontSize: "0.88rem", color: INK_SOFT, fontFamily: "var(--font-sans)" }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "11px", borderRadius: 10,
          border: "none", background: `linear-gradient(135deg,${TC_SOFT},${TC})`,
          color: "#FFF5E6", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
          fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
          {item ? "Update Item" : "Add Item"}
        </button>
      </div>
    </Modal>
  );
}

function CategoryModal({ restaurantId, onClose, onSave }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Modal title="Add Category" onClose={onClose}>
      <ModalField label="Category Name" value={name} onChange={setName} placeholder="e.g. Starters, Mains, Desserts" />
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10,
          border: `1.5px solid ${INK_HAIR}`, background: CARD, cursor: "pointer",
          fontSize: "0.88rem", color: INK_SOFT, fontFamily: "var(--font-sans)" }}>Cancel</button>
        <button onClick={async () => { if (!name) return; setSaving(true); await onSave({ name }).catch(() => {}); setSaving(false); }}
          disabled={saving}
          style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg,${TC_SOFT},${TC})`, color: "#FFF5E6",
            fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          Add Category
        </button>
      </div>
    </Modal>
  );
}

// ─── Shared UI ──────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,18,8,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      backdropFilter: "blur(4px)", animation: "fade-up 0.2s ease-out" }}>
      <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "28px", width: "100%",
        maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 60px rgba(28,18,8,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 500, color: INK }}>{title}</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${INK_HAIR}`,
            background: FIELD, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} style={{ color: INK_MUTED }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 6 }}>
        {label}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 12px", background: FIELD, borderRadius: 10,
          border: "1.5px solid transparent", fontSize: "0.88rem", color: INK,
          fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
          transition: "border-color 0.2s" }}
        onFocus={(e) => e.target.style.borderColor = TC}
        onBlur={(e) => e.target.style.borderColor = "transparent"}
      />
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ padding: "72px 24px", textAlign: "center",
      background: CARD, borderRadius: 20, border: `1.5px dashed ${INK_HAIR}` }}>
      <Icon size={36} style={{ color: INK_MUTED, margin: "0 auto 16px", display: "block" }} />
      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: INK, marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: "0.85rem", color: INK_SOFT }}>{subtitle}</p>
    </div>
  );
}

function NoRestaurantView() {
  const { createRestaurant, fetchMyRestaurants } = useOwnerStore();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", cuisineType: "", address: "" });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name || !form.cuisineType) { toast.error("Name and cuisine are required"); return; }
    setSaving(true);
    try {
      await createRestaurant(form);
      await fetchMyRestaurants();
      toast.success("Restaurant created! 🎉");
      setShow(false);
    } catch {
      toast.error("Failed to create restaurant");
    }
    setSaving(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: `${TC}12`,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Store size={32} style={{ color: TC }} />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: INK, marginBottom: 10 }}>
          No restaurant yet
        </h2>
        <p style={{ color: INK_SOFT, marginBottom: 24, lineHeight: 1.6 }}>
          Register your restaurant on FoodRush and start receiving orders!
        </p>
        <button onClick={() => setShow(true)} style={{
          padding: "12px 28px", borderRadius: 12, border: "none",
          background: `linear-gradient(135deg,${TC_SOFT},${TC})`, color: "#FFF5E6",
          fontWeight: 700, fontSize: "0.92rem", cursor: "pointer",
          boxShadow: `0 4px 16px ${TC}35`,
        }}>
          Register Restaurant
        </button>
      </div>
      {show && (
        <Modal title="Register Restaurant" onClose={() => setShow(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <ModalField label="Restaurant Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Sharma's Kitchen" />
            <ModalField label="Cuisine Type" value={form.cuisineType} onChange={(v) => setForm((p) => ({ ...p, cuisineType: v }))} placeholder="e.g. North Indian" />
            <ModalField label="Address" value={form.address} onChange={(v) => setForm((p) => ({ ...p, address: v }))} placeholder="Full address" />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => setShow(false)} style={{ flex: 1, padding: "11px", borderRadius: 10,
              border: `1.5px solid ${INK_HAIR}`, background: CARD, cursor: "pointer", fontSize: "0.88rem",
              color: INK_SOFT, fontFamily: "var(--font-sans)" }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} style={{ flex: 2, padding: "11px", borderRadius: 10,
              border: "none", background: `linear-gradient(135deg,${TC_SOFT},${TC})`, color: "#FFF5E6",
              fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", fontFamily: "var(--font-sans)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              Create Restaurant
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
