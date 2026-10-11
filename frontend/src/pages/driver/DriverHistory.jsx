import { useEffect } from "react";
import { DollarSign, Package, History } from "lucide-react";
import { useDriverStore } from "../../store/driverStore";

const TC      = "#C0401E";
const TC_SOFT = "#DE6A40";
const SUCCESS = "#15803D";
const SAFFRON = "#D4882A";
const INK     = "#1C1208";
const INK_SOFT = "rgba(28,18,8,0.6)";
const INK_MUTED = "rgba(28,18,8,0.38)";
const INK_HAIR = "rgba(28,18,8,0.07)";
const CARD    = "#FFF9EE";
const FIELD   = "#F5ECD8";

const STATUS_MAP = {
  DELIVERED: { label: "Delivered", color: SUCCESS,  bg: `${SUCCESS}12` },
  FAILED:    { label: "Failed",    color: "#DC2626", bg: "#DC262612" },
  ASSIGNED:  { label: "Assigned",  color: SAFFRON,  bg: `${SAFFRON}12` },
  PICKED_UP: { label: "Picked Up", color: TC,        bg: `${TC}12` },
};

export default function DriverHistory() {
  const { deliveryHistory, fetchDeliveryHistory } = useDriverStore();

  useEffect(() => { fetchDeliveryHistory().catch(() => {}); }, []);

  const list      = Array.isArray(deliveryHistory) ? deliveryHistory : [];
  const done      = list.filter(d => d.status === "DELIVERED" || d.deliveryStatus === "DELIVERED");
  const earnings  = done.reduce((s, d) => s + parseFloat(d.deliveryFee || d.earnings || 0), 0);
  const today     = done.filter(d => {
    if (!d.createdAt) return false;
    const dt = new Date(d.createdAt);
    const now = new Date();
    return dt.toDateString() === now.toDateString();
  });
  const todayEarnings = today.reduce((s, d) => s + parseFloat(d.deliveryFee || d.earnings || 0), 0);

  return (
    <div style={{ padding: "20px 16px 0" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 500,
        color: INK, marginBottom: 20 }}>Earnings & History</h2>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div style={{ background: `${SAFFRON}12`, borderRadius: 16, padding: "18px",
          border: `1px solid ${SAFFRON}25` }}>
          <div style={{ fontSize: "1.4rem", marginBottom: 6 }}>💰</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 500,
            color: SAFFRON }}>₹{todayEarnings.toFixed(0)}</div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: INK_MUTED, marginTop: 3 }}>Today's Earnings</div>
        </div>
        <div style={{ background: `${SUCCESS}10`, borderRadius: 16, padding: "18px",
          border: `1px solid ${SUCCESS}20` }}>
          <div style={{ fontSize: "1.4rem", marginBottom: 6 }}>✅</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 500,
            color: SUCCESS }}>{today.length}</div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: INK_MUTED, marginTop: 3 }}>Today's Deliveries</div>
        </div>
      </div>

      {/* All-time stats */}
      <div style={{ background: CARD, borderRadius: 16, padding: "18px 20px", marginBottom: 24,
        border: `1px solid ${INK_HAIR}`, display: "flex", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: INK }}>{done.length}</div>
          <div style={{ fontSize: "0.7rem", color: INK_MUTED, textTransform: "uppercase",
            letterSpacing: "0.06em", marginTop: 2 }}>Total Deliveries</div>
        </div>
        <div style={{ width: 1, background: INK_HAIR }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: SAFFRON }}>
            ₹{earnings.toFixed(0)}
          </div>
          <div style={{ fontSize: "0.7rem", color: INK_MUTED, textTransform: "uppercase",
            letterSpacing: "0.06em", marginTop: 2 }}>Total Earned</div>
        </div>
        <div style={{ width: 1, background: INK_HAIR }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: TC }}>
            {done.length > 0 ? `₹${(earnings / done.length).toFixed(0)}` : "—"}
          </div>
          <div style={{ fontSize: "0.7rem", color: INK_MUTED, textTransform: "uppercase",
            letterSpacing: "0.06em", marginTop: 2 }}>Avg. Per Trip</div>
        </div>
      </div>

      {/* History list */}
      <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.12em", color: INK_MUTED, marginBottom: 14 }}>All Deliveries</h3>

      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px",
          background: CARD, borderRadius: 20, border: `1.5px dashed ${INK_HAIR}` }}>
          <History size={36} style={{ color: INK_MUTED, margin: "0 auto 14px", display: "block" }} />
          <p style={{ fontSize: "0.9rem", fontWeight: 600, color: INK, marginBottom: 4 }}>No deliveries yet</p>
          <p style={{ fontSize: "0.82rem", color: INK_MUTED }}>Your completed trips will appear here</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.slice().reverse().map((d, i) => {
            const status = d.deliveryStatus || d.status || "DELIVERED";
            const meta   = STATUS_MAP[status] || STATUS_MAP.DELIVERED;
            const earn   = parseFloat(d.deliveryFee || d.earnings || 0);
            const date   = d.createdAt ? new Date(d.createdAt) : null;
            return (
              <div key={d.deliveryId || i} style={{ background: CARD, borderRadius: 14,
                padding: "14px 18px", border: `1px solid ${INK_HAIR}`,
                display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${meta.color}12`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.3rem", flexShrink: 0 }}>🛵</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: INK }}>
                    Order #{(d.orderId || d.deliveryId || "").slice(-6).toUpperCase()}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: INK_MUTED, marginTop: 2 }}>
                    {date ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                    {date && ` · ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  {earn > 0 && (
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: SAFFRON, fontWeight: 500 }}>
                      +₹{earn.toFixed(0)}
                    </span>
                  )}
                  <span style={{ padding: "3px 10px", borderRadius: 999, background: meta.bg,
                    color: meta.color, fontSize: "0.68rem", fontWeight: 700 }}>
                    {meta.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
