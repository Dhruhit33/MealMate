import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Loader2, RefreshCw, Bell, Clock, ShoppingBag } from "lucide-react";
import { useOwnerStore } from "../../store/ownerStore";
import socketService from "../../services/socketService";
import { notifyNewOrder } from "../../services/notificationService";

const INK      = "#1C1208";
const INK_SOFT = "rgba(28,18,8,0.6)";
const INK_MUTED = "rgba(28,18,8,0.38)";
const INK_HAIR = "rgba(28,18,8,0.07)";
const CARD     = "#FFF9EE";
const CARD2    = "#F5ECD8";
const TC       = "#C0401E";
const TC_SOFT  = "#DE6A40";
const TC_DEEP  = "#8B2910";
const SUCCESS  = "#15803D";
const SAFFRON  = "#D4882A";
const DANGER   = "#DC2626";

const STATUS_META = {
  PLACED:    { label: "New Order",  color: TC,        bg: `${TC}12` },
  CREATED:   { label: "New Order",  color: TC,        bg: `${TC}12` },
  ACCEPTED:  { label: "Accepted",   color: "#7C3AED", bg: "#7C3AED12" },
  CONFIRMED: { label: "Confirmed",  color: "#7C3AED", bg: "#7C3AED12" },
  PREPARING: { label: "Preparing",  color: SAFFRON,   bg: `${SAFFRON}12` },
  READY:     { label: "Ready",      color: SUCCESS,   bg: `${SUCCESS}12` },
  PICKED_UP: { label: "Picked Up",  color: TC_SOFT,   bg: `${TC}12`  },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: TC_SOFT, bg: `${TC}12` },
  DELIVERED: { label: "Delivered",  color: SUCCESS,   bg: `${SUCCESS}12` },
  COMPLETED: { label: "Completed",  color: SUCCESS,   bg: `${SUCCESS}12` },
  CANCELLED: { label: "Cancelled",  color: DANGER,    bg: `${DANGER}12` },
};

const NEXT = {
  PLACED:    { label: "Accept Order",  status: "CONFIRMED", color: TC_SOFT  },
  CREATED:   { label: "Accept Order",  status: "CONFIRMED", color: TC_SOFT  },
  CONFIRMED: { label: "Start Cooking", status: "PREPARING", color: SAFFRON  },
  ACCEPTED:  { label: "Start Cooking", status: "PREPARING", color: SAFFRON  },
  PREPARING: { label: "Mark Ready",    status: "READY",     color: SUCCESS  },
};

export default function OwnerOrders() {
  const {
    currentRestaurant, activeOrders, orders,
    fetchOrders, fetchActiveOrders, acceptOrder, updateOrderStatus,
  } = useOwnerStore();

  const [tab, setTab]             = useState("active");
  const [actionLoading, setAL]    = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [newAlert, setNewAlert]   = useState(false);
  const knownIds = useRef(new Set());

  const rid = currentRestaurant?.restaurantId;

  useEffect(() => {
    if (!rid) return;
    fetchOrders(rid);
    fetchActiveOrders(rid);
  }, [rid]);

  // Seed known IDs
  useEffect(() => { activeOrders.forEach(o => knownIds.current.add(o.orderId)); }, [activeOrders]);

  // WebSocket new orders
  useEffect(() => {
    if (!rid) return;
    let sub;
    const subscribe = () => {
      sub = socketService.subscribeToRestaurantOrders(rid, (ev) => {
        if (ev.orderId && !knownIds.current.has(ev.orderId)) {
          knownIds.current.add(ev.orderId);
          notifyNewOrder(ev.orderId);
          setNewAlert(true);
          setTimeout(() => setNewAlert(false), 8000);
          fetchActiveOrders(rid);
        }
      });
    };
    if (socketService.isConnected()) subscribe();
    else socketService.onConnect(subscribe);
    return () => { if (typeof sub?.unsubscribe === "function") sub.unsubscribe(); };
  }, [rid]);

  const doRefresh = async () => {
    if (!rid) return;
    setRefreshing(true);
    await Promise.all([fetchOrders(rid), fetchActiveOrders(rid)]);
    setRefreshing(false);
    toast.success("Refreshed!");
  };

  const handleAccept = async (order) => {
    setAL(p => ({ ...p, [order.orderId]: true }));
    try { await acceptOrder(rid, order.orderId, 25); toast.success("Order accepted! 🎉"); }
    catch { toast.error("Failed to accept"); }
    setAL(p => ({ ...p, [order.orderId]: false }));
  };

  const handleStatus = async (orderId, status) => {
    setAL(p => ({ ...p, [orderId]: true }));
    try { await updateOrderStatus(orderId, status); toast.success(`Marked as ${STATUS_META[status]?.label || status}`); }
    catch { toast.error("Failed to update"); }
    setAL(p => ({ ...p, [orderId]: false }));
  };

  const past = orders.filter(o => ["DELIVERED","COMPLETED","CANCELLED"].includes(o.status));

  return (
    <div style={{ color: INK, animation: "fade-up 0.4s ease-out" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 500, color: INK }}>
            Orders
          </h1>
          <p style={{ fontSize: "0.85rem", color: INK_MUTED, marginTop: 4 }}>
            {activeOrders.length} active · {past.length} completed
          </p>
        </div>
        <button onClick={doRefresh} disabled={refreshing} style={{ display: "flex", alignItems: "center",
          gap: 6, padding: "9px 16px", borderRadius: 10, border: `1px solid ${INK_HAIR}`,
          background: "transparent", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: INK_SOFT,
          fontFamily: "var(--font-sans)" }}>
          <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* New order banner */}
      {newAlert && (
        <div style={{ background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`, borderRadius: 14,
          padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12,
          animation: "slide-in 0.3s ease-out", boxShadow: `0 4px 20px ${TC}40` }}>
          <Bell size={20} style={{ color: "#FFF5E6" }} />
          <span style={{ color: "#FFF5E6", fontWeight: 700, fontSize: "0.95rem" }}>
            🔔 New order just came in!
          </span>
          <button onClick={() => setTab("active")}
            style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 999,
              border: "none", background: "rgba(255,255,255,0.2)", color: "#FFF5E6",
              fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>View →</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          { id: "active",  label: `Active (${activeOrders.length})` },
          { id: "history", label: `History (${past.length})` },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "9px 20px", borderRadius: 999,
            border: `1.5px solid ${tab === id ? TC : INK_HAIR}`,
            background: tab === id ? `${TC}12` : "transparent",
            color: tab === id ? TC : INK_MUTED,
            fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--font-sans)", transition: "all 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Active orders */}
      {tab === "active" && (
        activeOrders.length === 0
          ? <EmptyOrders />
          : <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {activeOrders.map((order) => {
                const meta   = STATUS_META[order.status] || STATUS_META.PLACED;
                const next   = NEXT[order.status];
                const isNew  = ["PLACED","CREATED"].includes(order.status);
                const busy   = actionLoading[order.orderId];

                return (
                  <div key={order.orderId} style={{ background: CARD, borderRadius: 20,
                    padding: "22px 24px", border: `1px solid ${isNew ? TC + "40" : INK_HAIR}`,
                    boxShadow: isNew ? `0 0 0 1px ${TC}20, 0 4px 20px rgba(192,64,30,0.1)` : "none",
                    animation: "slide-in 0.3s ease-out" }}>

                    {/* Order header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: INK }}>
                            Order #{order.orderId?.slice(-6)?.toUpperCase()}
                          </span>
                          {isNew && (
                            <span style={{ padding: "2px 8px", borderRadius: 4, background: `${TC}18`,
                              color: TC, fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase",
                              letterSpacing: "0.1em", animation: "pulse-badge 1.5s infinite" }}>
                              NEW
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: INK_MUTED }}>
                          {order.createdAt && new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          {order.estimatedDeliveryMins && ` · Est. ${order.estimatedDeliveryMins} mins`}
                        </div>
                      </div>
                      <span style={{ padding: "5px 14px", borderRadius: 999, background: meta.bg,
                        color: meta.color, fontSize: "0.75rem", fontWeight: 700 }}>{meta.label}</span>
                    </div>

                    {/* Items */}
                    <div style={{ background: CARD2, borderRadius: 14, padding: "14px 18px", marginBottom: 18 }}>
                      {(order.items || []).map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "center", padding: "5px 0",
                          borderBottom: i < order.items.length - 1 ? `1px solid ${INK_HAIR}` : "none",
                          fontSize: "0.88rem" }}>
                          <span style={{ color: INK }}>
                            <span style={{ color: TC, fontWeight: 700, marginRight: 6 }}>{item.quantity}×</span>
                            {item.itemName || item.name}
                          </span>
                          <span style={{ color: INK_MUTED }}>₹{parseFloat(item.price || 0) * item.quantity}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between",
                        fontSize: "0.95rem", fontWeight: 700, color: INK, marginTop: 12,
                        paddingTop: 12, borderTop: `1px solid ${INK_HAIR}` }}>
                        <span>Total</span>
                        <span style={{ color: TC }}>₹{parseFloat(order.totalAmount || 0).toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Customer address */}
                    {(order.deliveryAddress || order.deliverAddress) && (
                      <div style={{ fontSize: "0.78rem", color: INK_MUTED, marginBottom: 16,
                        padding: "8px 12px", background: CARD2, borderRadius: 8 }}>
                        📍 {order.deliveryAddress || order.deliverAddress}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10 }}>
                      {next && (
                        <button
                          onClick={() => isNew ? handleAccept(order) : handleStatus(order.orderId, next.status)}
                          disabled={busy}
                          style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none",
                            background: `linear-gradient(135deg, ${next.color}CC, ${next.color})`,
                            color: "#FFF5E6", fontWeight: 700, fontSize: "0.9rem",
                            cursor: busy ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            fontFamily: "var(--font-sans)", opacity: busy ? 0.7 : 1,
                            boxShadow: `0 4px 16px ${next.color}40` }}>
                          {busy ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                            : <CheckCircle size={16} />}
                          {next.label}
                        </button>
                      )}
                      {isNew && (
                        <button onClick={() => handleStatus(order.orderId, "CANCELLED")} disabled={busy}
                          style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #DC262625",
                            background: "#DC262608", color: DANGER, fontWeight: 600, fontSize: "0.88rem",
                            cursor: "pointer", fontFamily: "var(--font-sans)", display: "flex",
                            alignItems: "center", gap: 6 }}>
                          <XCircle size={15} /> Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
      )}

      {/* History */}
      {tab === "history" && (
        past.length === 0
          ? <div style={{ textAlign: "center", padding: "60px 24px", color: INK_MUTED }}>
              <Clock size={36} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
              <p>No completed orders yet</p>
            </div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {past.map((order) => {
                const meta = STATUS_META[order.status] || STATUS_META.DELIVERED;
                return (
                  <div key={order.orderId} style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", background: CARD, borderRadius: 14,
                    padding: "16px 20px", border: `1px solid ${INK_HAIR}` }}>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: INK }}>
                        #{order.orderId?.slice(-6)?.toUpperCase()}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: INK_MUTED, marginTop: 3 }}>
                        {order.items?.length || 0} items ·{" "}
                        {order.createdAt && new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem",
                        color: order.status === "CANCELLED" ? INK_MUTED : TC }}>
                        ₹{parseFloat(order.totalAmount || 0).toFixed(0)}
                      </span>
                      <span style={{ padding: "4px 12px", borderRadius: 999, background: meta.bg,
                        color: meta.color, fontSize: "0.72rem", fontWeight: 700 }}>{meta.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
      )}

      <style>{`
        @keyframes fade-up    { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes slide-in   { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-badge{ 0%,100%{opacity:1}50%{opacity:0.6} }
      `}</style>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px",
      border: `1.5px dashed rgba(28,18,8,0.1)`, borderRadius: 20 }}>
      <ShoppingBag size={40} style={{ color: "rgba(28,18,8,0.15)", margin: "0 auto 16px", display: "block" }} />
      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1C1208", marginBottom: 8 }}>
        No active orders
      </h3>
      <p style={{ fontSize: "0.88rem", color: "rgba(28,18,8,0.38)" }}>
        New orders will appear here instantly via live connection
      </p>
    </div>
  );
}
