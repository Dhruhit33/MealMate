import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, Shield, Pencil, Check, X, Loader2,
  ShoppingBag, Wallet, MapPin, ChevronRight, Clock,
  CheckCircle, XCircle, Bike, ArrowUpRight, ArrowRight, ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { useOrderStore } from "../../store/orderStore";
import { useWalletStore } from "../../store/walletStore";
import { useAddressStore } from "../../store/addressStore";

const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const CARD = "#FFF9EC";
const FIELD = "#F5EAD4";
const FIELD_FOCUS = "#FFFEF8";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_SOFT = "#E07848";
const TERRACOTTA_DEEP = "#8A2F18";
const SAFFRON = "#D98B3E";
const VEG = "#4A7C2B";

const STATUS_META = {
  CREATED:   { label: "Order placed",    color: "#1D4ED8", bg: "#EFF6FF", icon: Clock },
  CONFIRMED: { label: "Accepted",        color: "#6D28D9", bg: "#F5F3FF", icon: CheckCircle },
  PREPARING: { label: "Preparing",       color: "#D97706", bg: "#FFFBEB", icon: Clock },
  READY:     { label: "Ready",           color: "#059669", bg: "#ECFDF5", icon: CheckCircle },
  PICKED_UP: { label: "On the way",      color: TERRACOTTA, bg: `${TERRACOTTA}12`, icon: Bike },
  DELIVERED: { label: "Delivered",       color: VEG, bg: `${VEG}12`, icon: CheckCircle },
  COMPLETED: { label: "Completed",       color: VEG, bg: `${VEG}12`, icon: CheckCircle },
  CANCELLED: { label: "Cancelled",       color: "#DC2626", bg: "#FEF2F2", icon: XCircle },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: INK_MUTED, bg: FIELD, icon: Clock };
  const Icon = meta.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 999,
      background: meta.bg, color: meta.color,
      fontSize: "0.72rem", fontWeight: 600,
    }}>
      <Icon size={10} /> {meta.label}
    </span>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, fetchProfile, updateProfile } = useAuthStore();
  const { orders, fetchMyOrders, loading: ordersLoading } = useOrderStore();
  const { balance, fetchBalance } = useWalletStore();
  const { addresses, fetchAddresses } = useAddressStore();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });

  useEffect(() => {
    fetchProfile().catch(() => {});
    fetchMyOrders().catch(() => {});
    fetchBalance().catch(() => {});
    fetchAddresses().catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setForm({ name: user.name || "", phone: user.phone || "" });
  }, [user]);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setLoading(true);
    try {
      await updateProfile(form);
      toast.success("Profile updated successfully! ✨");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const badges = {
    CUSTOMER:         { label: "Customer",         bg: "#EFF6FF", color: "#1D4ED8" },
    DRIVER:           { label: "Delivery Partner", bg: "#F0FDF4", color: "#15803D" },
    RESTAURANT_OWNER: { label: "Restaurant Owner", bg: "#FFF7ED", color: "#C2410C" },
    ADMIN:            { label: "Admin",            bg: "#FAF5FF", color: "#7E22CE" },
  };
  const badge = badges[user?.role] || badges.CUSTOMER;

  const recentOrders = orders.slice(0, 4);

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", animation: "fade-up 0.4s ease-out" }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderRadius: 999,
          border: `1px solid ${INK_HAIR}`,
          background: CARD,
          color: INK_SOFT,
          fontSize: "0.82rem",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 16,
          fontFamily: "var(--font-sans)",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 3px rgba(43,29,18,0.04)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = TERRACOTTA_SOFT;
          e.currentTarget.style.color = TERRACOTTA_DEEP;
          e.currentTarget.style.transform = "translateX(-3px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = INK_HAIR;
          e.currentTarget.style.color = INK_SOFT;
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${CARD} 0%, #F5E8D0 100%)`,
        border: `1px solid ${INK_HAIR}`,
        borderRadius: 24,
        padding: "32px 36px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 20,
        boxShadow: "0 4px 20px rgba(43,29,18,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 60%, ${TERRACOTTA_DEEP})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.8rem", fontWeight: 700, color: "#FFF5E6",
            fontFamily: "var(--font-display)",
            boxShadow: `0 6px 18px ${TERRACOTTA}30`,
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.8rem",
                fontWeight: 600,
                color: INK,
                letterSpacing: "-0.02em",
                margin: 0,
              }}>
                {user?.name || "Welcome back"}
              </h1>
              <span style={{
                padding: "3px 10px", borderRadius: 999,
                background: badge.bg, color: badge.color,
                fontSize: "0.74rem", fontWeight: 700,
                letterSpacing: "0.02em",
              }}>
                {badge.label}
              </span>
            </div>
            <div style={{ fontSize: "0.88rem", color: INK_SOFT, marginTop: 4 }}>
              {user?.email || ""}
            </div>
          </div>
        </div>

        {/* Edit profile shortcut button */}
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 999,
              border: `1.5px solid ${INK_HAIR}`,
              background: "#FFF9EC",
              color: INK, fontSize: "0.85rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--font-sans)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = TERRACOTTA_SOFT; e.currentTarget.style.color = TERRACOTTA_DEEP; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = INK_HAIR; e.currentTarget.style.color = INK; }}
          >
            <Pencil size={13} /> Edit profile
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setEditing(false)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "9px 16px", borderRadius: 999,
                border: `1.5px solid ${INK_HAIR}`,
                background: "#FFF9EC", color: INK_SOFT,
                fontSize: "0.85rem", fontWeight: 500,
                cursor: "pointer", fontFamily: "var(--font-sans)",
              }}
            >
              <X size={13} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "9px 18px", borderRadius: 999, border: "none",
                background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA})`,
                color: "#FFF5E6", fontSize: "0.85rem", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />} Save
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16, marginBottom: 28,
      }}>
        <div
          onClick={() => navigate("/orders")}
          style={{
            background: CARD, border: `1px solid ${INK_HAIR}`,
            borderRadius: 18, padding: "20px 22px", cursor: "pointer",
            transition: "transform 0.18s, box-shadow 0.18s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(43,29,18,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${TERRACOTTA}12`, display: "flex", alignItems: "center", justifyContent: "center",
              color: TERRACOTTA,
            }}>
              <ShoppingBag size={18} />
            </div>
            <ArrowUpRight size={15} style={{ color: INK_MUTED }} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 600, color: INK }}>
            {orders.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: INK_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginTop: 2 }}>
            Total Orders
          </div>
        </div>

        <div
          onClick={() => navigate("/wallet")}
          style={{
            background: CARD, border: `1px solid ${INK_HAIR}`,
            borderRadius: 18, padding: "20px 22px", cursor: "pointer",
            transition: "transform 0.18s, box-shadow 0.18s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(43,29,18,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${VEG}15`, display: "flex", alignItems: "center", justifyContent: "center",
              color: VEG,
            }}>
              <Wallet size={18} />
            </div>
            <ArrowUpRight size={15} style={{ color: INK_MUTED }} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 600, color: INK }}>
            ₹{balance !== null ? Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "0"}
          </div>
          <div style={{ fontSize: "0.78rem", color: INK_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginTop: 2 }}>
            Wallet Balance
          </div>
        </div>

        <div
          onClick={() => navigate("/addresses")}
          style={{
            background: CARD, border: `1px solid ${INK_HAIR}`,
            borderRadius: 18, padding: "20px 22px", cursor: "pointer",
            transition: "transform 0.18s, box-shadow 0.18s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(43,29,18,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${SAFFRON}18`, display: "flex", alignItems: "center", justifyContent: "center",
              color: SAFFRON,
            }}>
              <MapPin size={18} />
            </div>
            <ArrowUpRight size={15} style={{ color: INK_MUTED }} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 600, color: INK }}>
            {addresses.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: INK_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginTop: 2 }}>
            Saved Addresses
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div style={{
        background: CARD, border: `1px solid ${INK_HAIR}`,
        borderRadius: 20, padding: 24, marginBottom: 28,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${INK_HAIR}`,
        }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600, color: INK, margin: 0 }}>
              Personal Details
            </h2>
            <p style={{ fontSize: "0.82rem", color: INK_SOFT, margin: "3px 0 0" }}>
              Your account details and contact information
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Full Name */}
          <div style={{
            background: FIELD, borderRadius: 14, padding: "14px 18px",
            border: `1.5px solid ${editing ? TERRACOTTA_SOFT : "transparent"}`,
          }}>
            <div style={{ fontSize: "0.72rem", color: INK_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>
              Full Name
            </div>
            {editing ? (
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  width: "100%", background: FIELD_FOCUS, border: `1px solid ${TERRACOTTA_SOFT}`,
                  borderRadius: 8, padding: "6px 10px", fontSize: "0.95rem", color: INK,
                  fontFamily: "var(--font-sans)", outline: "none",
                }}
              />
            ) : (
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: INK }}>
                {user?.name || "—"}
              </div>
            )}
          </div>

          {/* Phone */}
          <div style={{
            background: FIELD, borderRadius: 14, padding: "14px 18px",
            border: `1.5px solid ${editing ? TERRACOTTA_SOFT : "transparent"}`,
          }}>
            <div style={{ fontSize: "0.72rem", color: INK_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>
              Phone Number
            </div>
            {editing ? (
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{
                  width: "100%", background: FIELD_FOCUS, border: `1px solid ${TERRACOTTA_SOFT}`,
                  borderRadius: 8, padding: "6px 10px", fontSize: "0.95rem", color: INK,
                  fontFamily: "var(--font-sans)", outline: "none",
                }}
              />
            ) : (
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: INK }}>
                {user?.phone || "—"}
              </div>
            )}
          </div>

          {/* Email */}
          <div style={{ background: FIELD, borderRadius: 14, padding: "14px 18px" }}>
            <div style={{ fontSize: "0.72rem", color: INK_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>
              Email Address
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: INK }}>
              {user?.email || "—"}
            </div>
          </div>

          {/* Role */}
          <div style={{ background: FIELD, borderRadius: 14, padding: "14px 18px" }}>
            <div style={{ fontSize: "0.72rem", color: INK_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>
              Account Type
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: INK }}>
              {badge.label}
            </div>
          </div>
        </div>
      </div>

      {/* ── Order History Section ──────────────────────────────── */}
      <div style={{
        background: CARD, border: `1px solid ${INK_HAIR}`,
        borderRadius: 20, padding: 24, marginBottom: 28,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${INK_HAIR}`,
        }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 600, color: INK, margin: 0 }}>
              Order History & Activity
            </h2>
            <p style={{ fontSize: "0.82rem", color: INK_SOFT, margin: "3px 0 0" }}>
              Your recent meals and order timeline
            </p>
          </div>
          {orders.length > 0 && (
            <Link
              to="/orders"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                color: TERRACOTTA_DEEP, fontSize: "0.85rem", fontWeight: 600,
                textDecoration: "none",
              }}
            >
              View all ({orders.length}) <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {ordersLoading && orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: INK_MUTED }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.85rem" }}>Loading your orders...</div>
          </div>
        ) : recentOrders.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            background: FIELD, borderRadius: 16, border: `1.5px dashed ${INK_HAIR}`,
          }}>
            <ShoppingBag size={38} style={{ color: INK_MUTED, margin: "0 auto 12px" }} />
            <div style={{ fontSize: "1rem", fontWeight: 600, color: INK, marginBottom: 4 }}>
              No orders placed yet
            </div>
            <div style={{ fontSize: "0.85rem", color: INK_SOFT, marginBottom: 18 }}>
              Explore nearby restaurants and place your first delicious order!
            </div>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "9px 22px", borderRadius: 999, border: "none",
                background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA})`,
                color: "#FFF5E6", fontSize: "0.85rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "var(--font-sans)",
              }}
            >
              Explore Restaurants
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentOrders.map((order) => {
              const dateStr = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                  })
                : "Recent";
              const itemCount = order.items?.length || 0;

              return (
                <div
                  key={order.orderId}
                  onClick={() => navigate(`/orders/${order.orderId}`)}
                  style={{
                    background: FIELD, borderRadius: 14, padding: "16px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 16, cursor: "pointer", transition: "all 0.18s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#EFE2C6"; e.currentTarget.style.transform = "translateX(2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = FIELD; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${TERRACOTTA}15`, display: "flex", alignItems: "center",
                      justifyContent: "center", color: TERRACOTTA_DEEP, flexShrink: 0,
                    }}>
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: INK }}>
                        {order.restaurantName || `Order #${order.orderId?.slice(-6)}`}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: INK_SOFT, marginTop: 3 }}>
                        {dateStr} · {itemCount} item{itemCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: INK }}>
                        ₹{Number(order.totalAmount || 0).toFixed(2)}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: INK_MUTED }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Navigation shortcuts ────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div
          onClick={() => navigate("/addresses")}
          style={{
            background: CARD, border: `1px solid ${INK_HAIR}`,
            borderRadius: 18, padding: "18px 22px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            transition: "all 0.18s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = TERRACOTTA_SOFT; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = INK_HAIR; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `${SAFFRON}18`, display: "flex", alignItems: "center", justifyContent: "center",
              color: SAFFRON,
            }}>
              <MapPin size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.92rem", fontWeight: 600, color: INK }}>Delivery Addresses</div>
              <div style={{ fontSize: "0.78rem", color: INK_MUTED }}>Manage your saved locations</div>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: INK_MUTED }} />
        </div>

        <div
          onClick={() => navigate("/wallet")}
          style={{
            background: CARD, border: `1px solid ${INK_HAIR}`,
            borderRadius: 18, padding: "18px 22px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            transition: "all 0.18s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = TERRACOTTA_SOFT; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = INK_HAIR; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `${VEG}18`, display: "flex", alignItems: "center", justifyContent: "center",
              color: VEG,
            }}>
              <Wallet size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.92rem", fontWeight: 600, color: INK }}>Wallet & Transactions</div>
              <div style={{ fontSize: "0.78rem", color: INK_MUTED }}>Add funds, check transactions</div>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: INK_MUTED }} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
