import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ChevronRight, Loader2, Clock, CheckCircle, XCircle, Bike, Navigation } from "lucide-react";
import { useOrderStore } from "../../store/orderStore";

const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const CARD = "#FFF9EC";
const FIELD = "#F5EAD4";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_SOFT = "#E07848";
const TERRACOTTA_DEEP = "#8A2F18";
const VEG = "#4A7C2B";

const STATUS_META = {
  CREATED:          { label: "Order placed",      color: "#1D4ED8", bg: "#EFF6FF", icon: Clock },
  CONFIRMED:        { label: "Accepted",           color: "#6D28D9", bg: "#F5F3FF", icon: CheckCircle },
  PREPARING:        { label: "Preparing",          color: "#D97706", bg: "#FFFBEB", icon: Clock },
  READY:            { label: "Ready for pickup",   color: "#059669", bg: "#ECFDF5", icon: CheckCircle },
  PICKED_UP:        { label: "On the way",         color: TERRACOTTA, bg: `${TERRACOTTA}12`, icon: Bike },
  DELIVERED:        { label: "Delivered",          color: VEG, bg: `${VEG}12`, icon: CheckCircle },
  COMPLETED:        { label: "Completed",          color: VEG, bg: `${VEG}12`, icon: CheckCircle },
  CANCELLED:        { label: "Cancelled",          color: "#DC2626", bg: "#FEF2F2", icon: XCircle },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: INK_MUTED, bg: FIELD, icon: Clock };
  const Icon = meta.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 999,
      background: meta.bg, color: meta.color,
      fontSize: "0.75rem", fontWeight: 600,
    }}>
      <Icon size={11} /> {meta.label}
    </span>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders, loading, fetchMyOrders } = useOrderStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchMyOrders(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyOrders();
    setRefreshing(false);
  };

  const active = orders.filter((o) =>
    !["DELIVERED", "COMPLETED", "CANCELLED"].includes(o.status)
  );
  const past = orders.filter((o) =>
    ["DELIVERED", "COMPLETED", "CANCELLED"].includes(o.status)
  );

  if (loading && orders.length === 0) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: 40, textAlign: "center", color: INK_MUTED }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
        Loading orders...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", animation: "fade-up 0.4s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "2rem",
            fontWeight: 500, letterSpacing: "-0.02em", color: INK,
          }}>My orders</h1>
          <p style={{ fontSize: "0.9rem", color: INK_SOFT, marginTop: 4 }}>
            {orders.length} order{orders.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={{
          padding: "8px 16px", borderRadius: 999,
          border: `1px solid ${INK_HAIR}`, background: CARD,
          color: INK_SOFT, fontSize: "0.82rem", fontWeight: 500,
          fontFamily: "var(--font-sans)", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {refreshing
            ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            : "↻"} Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px 24px",
          background: CARD, borderRadius: 16, border: `1.5px dashed ${INK_HAIR}`,
        }}>
          <ShoppingBag size={40} style={{ color: INK_MUTED, margin: "0 auto 16px", display: "block" }} />
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: 6, color: INK }}>
            No orders yet
          </h3>
          <p style={{ fontSize: "0.9rem", color: INK_SOFT, marginBottom: 20 }}>
            Your first meal is just a tap away
          </p>
          <button onClick={() => navigate("/")} style={{
            padding: "10px 24px", borderRadius: 999, border: "none",
            background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
            color: "#FFF5E6", fontSize: "0.88rem", fontWeight: 600,
            fontFamily: "var(--font-sans)", cursor: "pointer",
          }}>Browse restaurants</button>
        </div>
      ) : (
        <>
          {/* Active orders */}
          {active.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <div style={{
                fontSize: "0.72rem", color: INK_MUTED,
                textTransform: "uppercase", letterSpacing: "0.12em",
                fontWeight: 600, marginBottom: 12,
              }}>Active</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {active.map((order, i) => (
                  <OrderCard key={order.orderId} order={order} index={i} onClick={() => navigate(`/orders/${order.orderId}`)} />
                ))}
              </div>
            </section>
          )}

          {/* Past orders */}
          {past.length > 0 && (
            <section>
              <div style={{
                fontSize: "0.72rem", color: INK_MUTED,
                textTransform: "uppercase", letterSpacing: "0.12em",
                fontWeight: 600, marginBottom: 12,
              }}>Past orders</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {past.map((order, i) => (
                  <OrderCard key={order.orderId} order={order} index={i} onClick={() => navigate(`/orders/${order.orderId}`)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function OrderCard({ order, index, onClick }) {
  const navigate = useNavigate();
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const isActive = !["DELIVERED", "CANCELLED"].includes(order.status);

  return (
    <div onClick={onClick} style={{
      background: CARD, borderRadius: 14, border: `1px solid ${INK_HAIR}`,
      padding: "18px 20px", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 16,
      transition: "all 0.2s", animation: `fade-up 0.3s ease-out ${index * 0.05}s both`,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = TERRACOTTA_SOFT; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = INK_HAIR; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${TERRACOTTA}10`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <ShoppingBag size={20} style={{ color: TERRACOTTA_DEEP }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.95rem", fontWeight: 600, color: INK }}>
            {order.restaurantName || `Order #${String(order.orderId).slice(-6)}`}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <div style={{ fontSize: "0.82rem", color: INK_MUTED, display: "flex", gap: 10 }}>
          {date && <span>{date}</span>}
          {order.totalAmount && <span>· ₹{order.totalAmount}</span>}
          {order.items?.length && <span>· {order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>}
        </div>
      </div>

      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${order.orderId}/track`);
          }}
          style={{
            padding: "7px 14px", borderRadius: 999, border: "none",
            background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA_DEEP})`,
            color: "#FFF5E6", fontSize: "0.75rem", fontWeight: 700,
            fontFamily: "var(--font-sans)", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
            boxShadow: `0 3px 10px ${TERRACOTTA}40`,
            flexShrink: 0, whiteSpace: "nowrap",
          }}
        >
          <Navigation size={11} /> Track
        </button>
      )}

      <ChevronRight size={16} style={{ color: INK_MUTED, flexShrink: 0 }} />
    </div>
  );
}
