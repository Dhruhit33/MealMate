import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Bike,
  Loader2, AlertTriangle, MapPin, Navigation
} from "lucide-react";
import toast from "react-hot-toast";
import { useOrderStore } from "../store/orderStore";

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

const ORDER_STEPS = [
  { key: "PLACED",           label: "Order placed",      desc: "We've received your order", icon: Clock },
  { key: "ACCEPTED",         label: "Accepted",           desc: "Restaurant confirmed", icon: CheckCircle },
  { key: "PREPARING",        label: "Being prepared",     desc: "Chef is cooking your food", icon: Clock },
  { key: "READY",            label: "Ready for pickup",   desc: "Waiting for delivery partner", icon: CheckCircle },
  { key: "OUT_FOR_DELIVERY", label: "On the way",         desc: "Your food is heading to you", icon: Bike },
  { key: "DELIVERED",        label: "Delivered",          desc: "Enjoy your meal!", icon: CheckCircle },
];

function getStepIndex(status) {
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentOrder, loading, fetchOrder, cancelOrder } = useOrderStore();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (orderId) fetchOrder(orderId);
    // Poll every 15s for active orders
    const interval = setInterval(() => {
      if (orderId) fetchOrder(orderId);
    }, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelOrder(orderId);
      toast.success("Order cancelled successfully");
      setShowCancelConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading || !currentOrder) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px", color: INK_MUTED }}>
        <Loader2 size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
        Loading order...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const order = currentOrder;
  const isCancelled = order.status === "CANCELLED";
  const isDelivered = order.status === "DELIVERED";
  const canCancel = order.status === "PLACED";
  const currentStepIdx = getStepIndex(order.status);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", animation: "fade-up 0.4s ease-out" }}>
      <button onClick={() => navigate("/orders")} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 999, border: `1px solid ${INK_HAIR}`,
        background: CARD, color: INK_SOFT, fontSize: "0.85rem",
        fontFamily: "var(--font-sans)", cursor: "pointer", marginBottom: 24,
      }}>
        <ArrowLeft size={14} /> My orders
      </button>

      {/* Header */}
      <div style={{
        background: CARD, borderRadius: 18, border: `1px solid ${INK_HAIR}`,
        padding: "24px 28px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: "1.8rem",
              fontWeight: 500, letterSpacing: "-0.02em", color: INK, marginBottom: 4,
            }}>
              {order.restaurantName || "Order"}
            </h1>
            <p style={{ fontSize: "0.82rem", color: INK_MUTED }}>
              Order #{String(order.orderId).slice(-8).toUpperCase()}
            </p>
          </div>
          {order.totalAmount && (
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: "1.6rem",
                fontWeight: 500, color: TERRACOTTA_DEEP,
              }}>₹{order.totalAmount}</div>
              <p style={{ fontSize: "0.78rem", color: INK_MUTED }}>Total paid</p>
            </div>
          )}
        </div>

        {/* Delivery address */}
        {order.deliveryAddress && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            marginTop: 16, paddingTop: 16, borderTop: `1px solid ${INK_HAIR}`,
            fontSize: "0.85rem", color: INK_SOFT,
          }}>
            <MapPin size={14} style={{ marginTop: 2, flexShrink: 0, color: TERRACOTTA }} />
            <span>
              {typeof order.deliveryAddress === "object"
                ? [order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.state]
                    .filter(Boolean).join(", ")
                : order.deliveryAddress}
            </span>
          </div>
        )}
      </div>

      {/* Track order button — for any active order */}
      {!isCancelled && !isDelivered && (
        <div style={{
          background: `linear-gradient(135deg, #1A1814 0%, #2D2520 100%)`,
          borderRadius: 18, padding: "20px 24px", marginBottom: 20,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          position: "relative", overflow: "hidden",
        }}>
          {/* Decorative */}
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120,
            borderRadius: "50%", background: `${TERRACOTTA}18`, pointerEvents: "none" }} />
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#FFF5E6", marginBottom: 4 }}>
              {order.status === "OUT_FOR_DELIVERY" ? "🛵 Your order is on the way!" : "📦 Track your order live"}
            </div>
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
              {order.status === "OUT_FOR_DELIVERY" ? "See your delivery partner on the map" : "Follow every step in real-time"}
            </div>
          </div>
          <button onClick={() => navigate(`/orders/${orderId}/track`)} style={{
            padding: "11px 24px", borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
            color: "#FFF5E6", fontSize: "0.88rem", fontWeight: 700,
            fontFamily: "var(--font-sans)", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: `0 6px 18px ${TERRACOTTA}50`,
            flexShrink: 0, position: "relative", zIndex: 1,
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <Navigation size={15} /> Track Order
          </button>
        </div>
      )}

      {/* Status stepper */}
      {!isCancelled ? (
        <div style={{
          background: CARD, borderRadius: 18, border: `1px solid ${INK_HAIR}`,
          padding: "24px 28px", marginBottom: 20,
        }}>
          <h2 style={{
            fontSize: "0.95rem", fontWeight: 700, color: INK, marginBottom: 24,
          }}>Order status</h2>

          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div style={{
              position: "absolute", left: 15, top: 8, bottom: 8,
              width: 2, background: INK_HAIR, zIndex: 0,
            }} />
            {/* Progress line */}
            <div style={{
              position: "absolute", left: 15, top: 8,
              width: 2, zIndex: 1,
              height: `${Math.min(currentStepIdx / (ORDER_STEPS.length - 1), 1) * 100}%`,
              background: `linear-gradient(180deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA})`,
              transition: "height 0.5s ease",
            }} />

            {ORDER_STEPS.map((step, i) => {
              const done = i < currentStepIdx;
              const active = i === currentStepIdx;
              const Icon = step.icon;
              return (
                <div key={step.key} style={{
                  display: "flex", alignItems: "flex-start", gap: 20,
                  marginBottom: i < ORDER_STEPS.length - 1 ? 24 : 0,
                  position: "relative", zIndex: 2,
                }}>
                  {/* Circle */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: done || active
                      ? `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA_DEEP})`
                      : "#FFF",
                    border: `2px solid ${done || active ? TERRACOTTA : INK_HAIR}`,
                    boxShadow: active ? `0 0 0 4px ${TERRACOTTA}20` : "none",
                    transition: "all 0.3s",
                  }}>
                    <Icon
                      size={14}
                      style={{ color: done || active ? "#FFF5E6" : INK_MUTED }}
                    />
                  </div>
                  <div style={{ paddingTop: 6 }}>
                    <div style={{
                      fontSize: "0.92rem", fontWeight: active ? 700 : done ? 600 : 400,
                      color: active ? INK : done ? INK_SOFT : INK_MUTED,
                    }}>{step.label}</div>
                    {(active || done) && (
                      <div style={{ fontSize: "0.78rem", color: INK_MUTED, marginTop: 2 }}>
                        {step.desc}
                      </div>
                    )}
                    {active && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        marginTop: 6, padding: "3px 8px", borderRadius: 999,
                        background: `${TERRACOTTA}10`, color: TERRACOTTA_DEEP,
                        fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: "50%", background: TERRACOTTA,
                          animation: "pulse 1.5s ease-in-out infinite",
                        }} />
                        Current
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          background: "#FEF2F2", borderRadius: 14, border: "1px solid #FECACA",
          padding: "20px 24px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <XCircle size={22} style={{ color: "#DC2626", flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, color: "#991B1B", marginBottom: 2 }}>Order cancelled</p>
            <p style={{ fontSize: "0.84rem", color: "#DC2626" }}>
              This order has been cancelled. Refund will be processed to your wallet.
            </p>
          </div>
        </div>
      )}

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <div style={{
          background: CARD, borderRadius: 18, border: `1px solid ${INK_HAIR}`,
          padding: "24px 28px", marginBottom: 20,
        }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: INK, marginBottom: 16 }}>
            Items ordered
          </h2>
          {order.items.map((item, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: i < order.items.length - 1 ? `1px solid ${INK_HAIR}` : "none",
              fontSize: "0.9rem",
            }}>
              <span style={{ color: INK, fontWeight: 500 }}>
                {item.quantity > 1 && (
                  <span style={{ color: TERRACOTTA, fontWeight: 700, marginRight: 6 }}>
                    {item.quantity}×
                  </span>
                )}
                {item.name || item.menuItemName}
              </span>
              <span style={{ color: INK_SOFT, fontWeight: 400 }}>
                ₹{((item.price || 0) * (item.quantity || 1)).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cancel button */}
      {canCancel && (
        <button onClick={() => setShowCancelConfirm(true)} style={{
          width: "100%", padding: "14px", borderRadius: 12,
          border: "1.5px solid #FECACA", background: "#FEF2F2",
          color: "#DC2626", fontSize: "0.9rem", fontWeight: 600,
          fontFamily: "var(--font-sans)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s",
        }}>
          <AlertTriangle size={16} /> Cancel order
        </button>
      )}

      {/* Cancel confirm modal */}
      {showCancelConfirm && (
        <div onClick={() => setShowCancelConfirm(false)} style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(43,29,18,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, animation: "fade-in 0.2s ease-out",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#FFFAF0", borderRadius: 20, padding: "32px 28px",
            maxWidth: 360, width: "100%",
            boxShadow: "0 20px 60px rgba(43,29,18,0.25)",
            animation: "scale-in 0.2s ease-out",
          }}>
            <div style={{ fontSize: "2rem", textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <h3 style={{
              fontFamily: "var(--font-display)", fontSize: "1.3rem",
              fontWeight: 500, color: INK, marginBottom: 10, textAlign: "center",
            }}>Cancel this order?</h3>
            <p style={{ fontSize: "0.88rem", color: INK_SOFT, textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
              The order will be cancelled and any payment refunded to your wallet.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowCancelConfirm(false)} style={{
                flex: 1, padding: "12px", borderRadius: 12,
                border: `1px solid ${INK_HAIR}`, background: "transparent",
                color: INK_SOFT, fontSize: "0.88rem", fontWeight: 500,
                fontFamily: "var(--font-sans)", cursor: "pointer",
              }}>Keep order</button>
              <button onClick={handleCancel} disabled={cancelling} style={{
                flex: 1, padding: "12px", borderRadius: 12, border: "none",
                background: "#DC2626", color: "#fff",
                fontSize: "0.88rem", fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: cancelling ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                {cancelling
                  ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  : "Yes, cancel"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0}to{opacity:1} }
        @keyframes scale-in { from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
