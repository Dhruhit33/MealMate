import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Plus, CheckCircle, Loader2, ArrowLeft, ShoppingBag,
  Navigation, CreditCard, Wallet, AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "../../store/cartStore";
import { useAddressStore } from "../../store/addressStore";
import { useOrderStore } from "../../store/orderStore";
import { useWalletStore } from "../../store/walletStore";

const INK      = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const CARD     = "#FFF9EC";
const FIELD    = "#F5EAD4";
const TC       = "#C14A2A";
const TC_SOFT  = "#E07848";
const TC_DEEP  = "#8A2F18";
const VEG      = "#4A7C2B";

function VegDot({ isVeg }) {
  const c = isVeg ? VEG : "#A83232";
  return (
    <span style={{ width: 9, height: 9, border: `1.5px solid ${c}`, borderRadius: 2,
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: c }} />
    </span>
  );
}

// ── Order success screen ──────────────────────────────────────────────────────
function OrderSuccess({ orderId, onTrack, onHome }) {
  const [step, setStep] = useState(0);
  const steps = ["Order placed!", "Funds locked from wallet", "Restaurant notified", "Finding driver..."];

  useEffect(() => {
    if (step < steps.length - 1) {
      const t = setTimeout(() => setStep((s) => s + 1), 900);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center", animation: "bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
      <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 28px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `${VEG}15`,
          animation: "ripple 1.5s ease-out 0.3s both" }} />
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: `${VEG}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}>
          <CheckCircle size={48} style={{ color: VEG }} />
        </div>
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 500,
        color: INK, marginBottom: 10, letterSpacing: "-0.02em" }}>Order placed! 🎉</h2>
      <p style={{ color: INK_SOFT, fontSize: "0.95rem", marginBottom: 8 }}>
        Your food is being prepared. Payment will be settled on delivery.
      </p>
      {orderId && (
        <p style={{ fontSize: "0.82rem", color: INK_MUTED, marginBottom: 28 }}>Order #{orderId}</p>
      )}

      {/* Progress steps */}
      <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${INK_HAIR}`,
        padding: "20px 24px", marginBottom: 28, textAlign: "left" }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12,
            padding: "8px 0", opacity: i <= step ? 1 : 0.3, transition: "opacity 0.4s" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%",
              background: i < step ? VEG : i === step ? TC : INK_HAIR,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              transition: "background 0.3s" }}>
              {i < step
                ? <CheckCircle size={12} style={{ color: "#FFF" }} />
                : i === step
                  ? <Loader2 size={12} style={{ color: "#FFF", animation: "spin 1s linear infinite" }} />
                  : null}
            </div>
            <span style={{ fontSize: "0.88rem", fontWeight: i === step ? 600 : 400, color: INK }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={onTrack} style={{ padding: "12px 24px", borderRadius: 12, border: "none",
          background: `linear-gradient(135deg, ${TC_SOFT}, ${TC} 55%, ${TC_DEEP})`,
          color: "#FFF5E6", fontSize: "0.9rem", fontWeight: 600,
          fontFamily: "var(--font-sans)", cursor: "pointer", boxShadow: `0 6px 18px ${TC}40`,
          display: "flex", alignItems: "center", gap: 8 }}>
          <Navigation size={15} /> Track my order
        </button>
        <button onClick={onHome} style={{ padding: "12px 24px", borderRadius: 12,
          border: `1px solid ${INK_HAIR}`, background: CARD, color: INK_SOFT,
          fontSize: "0.9rem", fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
          Back to home
        </button>
      </div>

      <style>{`
        @keyframes bounce-in { from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)} }
        @keyframes scale-in  { from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)} }
        @keyframes ripple    { from{opacity:0.8;transform:scale(0.8)}to{opacity:0;transform:scale(2.5)} }
        @keyframes spin      { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, restaurantName, getTotal, clearCart } = useCartStore();
  const { addresses, fetchAddresses } = useAddressStore();
  const { placeOrder } = useOrderStore();
  const { balance, lockedBalance, fetchBalance, lockFunds, releaseFunds } = useWalletStore();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const total       = getTotal();
  const deliveryFee = total >= 499 ? 0 : 29;
  const grandTotal  = total + deliveryFee;
  const hasSufficientBalance = balance !== null && balance >= grandTotal;

  useEffect(() => {
    fetchAddresses();
    fetchBalance();
    if (items.length === 0 && !success) navigate("/");
  }, []);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) setSelectedAddress(addresses[0].addressId);
  }, [addresses]);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return toast.error("Please select a delivery address");
    if (!hasSufficientBalance) {
      return toast.error("Insufficient wallet balance. Please add funds first.");
    }

    setPlacing(true);
    let fundsLocked = false;
    let tempOrderId = null;

    try {
      // Step 1: Place order first to get the orderId
      const addrObj = addresses.find((a) => a.addressId === selectedAddress);
      const order = await placeOrder(addrObj);
      tempOrderId = order.orderId;

      // Step 2: Lock funds for this order (SAGA Step 1)
      try {
        await lockFunds(order.orderId, grandTotal);
        fundsLocked = true;
      } catch (lockErr) {
        // Lock failed — order was placed but can't pay
        // The backend order is already created, but without locked funds
        // the settlement will fail gracefully later.
        const msg = lockErr.response?.data?.message || "Failed to lock wallet funds";
        if (msg.toLowerCase().includes("insufficient")) {
          toast.error("Insufficient wallet balance. Add funds and try again.");
        } else {
          toast.error(msg);
        }
        // Don't block the order — backend handles settlement via Kafka
        // but warn the user
        console.warn("Fund lock failed, order placed without lock:", msg);
      }

      // Step 3: Clear cart and show success
      await clearCart();
      setOrderId(order.orderId);
      setSuccess(true);
    } catch (err) {
      // Order placement failed
      toast.error(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (success) {
    return (
      <OrderSuccess
        orderId={orderId}
        onTrack={() => navigate(orderId ? `/orders/${orderId}/track` : "/orders")}
        onHome={() => navigate("/")}
      />
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", animation: "fade-up 0.4s ease-out" }}>
      <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 999, border: `1px solid ${INK_HAIR}`,
        background: CARD, color: INK_SOFT, fontSize: "0.85rem", fontFamily: "var(--font-sans)",
        cursor: "pointer", marginBottom: 28 }}>
        <ArrowLeft size={14} /> Back
      </button>

      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 500,
        letterSpacing: "-0.02em", color: INK, marginBottom: 32 }}>Checkout</h1>

      <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>
        {/* LEFT: Address */}
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: INK, marginBottom: 16 }}>Deliver to</h2>

          {addresses.length === 0 ? (
            <div style={{ background: CARD, borderRadius: 14, border: `1.5px dashed ${INK_HAIR}`,
              padding: "32px 24px", textAlign: "center" }}>
              <MapPin size={28} style={{ color: INK_MUTED, margin: "0 auto 12px", display: "block" }} />
              <p style={{ fontWeight: 600, color: INK, marginBottom: 4 }}>No addresses saved</p>
              <p style={{ fontSize: "0.85rem", color: INK_SOFT, marginBottom: 16 }}>Add a delivery address to continue</p>
              <button onClick={() => navigate("/addresses")} style={{ padding: "10px 20px", borderRadius: 999,
                border: "none", background: TC, color: "#FFF5E6", fontSize: "0.85rem", fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Plus size={14} /> Add address
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {addresses.map((addr) => {
                const selected = selectedAddress === addr.addressId;
                const labels   = { HOME: "🏠 Home", WORK: "💼 Work", OTHER: "📍 Other" };
                return (
                  <div key={addr.addressId} onClick={() => setSelectedAddress(addr.addressId)} style={{
                    background: selected ? `${TC}06` : CARD, borderRadius: 14,
                    border: `1.5px solid ${selected ? TC : INK_HAIR}`,
                    padding: "16px 20px", cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%",
                      border: `2px solid ${selected ? TC : INK_HAIR}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 2, background: selected ? TC : "transparent",
                      transition: "all 0.2s" }}>
                      {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFF" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: INK, marginBottom: 4 }}>
                        {labels[addr.label] || addr.label}
                      </div>
                      <p style={{ fontSize: "0.84rem", color: INK_SOFT, lineHeight: 1.5 }}>
                        {[addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => navigate("/addresses")} style={{ padding: "12px", borderRadius: 12,
                border: `1.5px dashed ${INK_HAIR}`, background: "transparent", color: INK_MUTED,
                fontSize: "0.85rem", fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Plus size={14} /> Add new address
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Summary */}
        <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${INK_HAIR}`,
          padding: "24px", position: "sticky", top: 96 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
            paddingBottom: 14, borderBottom: `1px solid ${INK_HAIR}` }}>
            <ShoppingBag size={16} style={{ color: TC }} />
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 500, color: INK }}>
              Order summary
            </h3>
          </div>

          {restaurantName && (
            <p style={{ fontSize: "0.78rem", color: INK_MUTED, marginBottom: 14 }}>from {restaurantName}</p>
          )}

          <div style={{ marginBottom: 18 }}>
            {items.map((item) => (
              <div key={item.menuItemId} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <VegDot isVeg={item.isVeg} />
                <span style={{ flex: 1, fontSize: "0.88rem", color: INK, fontWeight: 500 }}>
                  {item.name}
                  {item.quantity > 1 && <span style={{ color: INK_MUTED, fontWeight: 400 }}> ×{item.quantity}</span>}
                </span>
                <span style={{ fontSize: "0.88rem", color: INK, fontWeight: 600 }}>
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ paddingTop: 14, borderTop: `1px solid ${INK_HAIR}` }}>
            {[
              { label: "Subtotal",     value: `₹${total.toFixed(0)}` },
              { label: "Delivery fee", value: deliveryFee === 0 ? "FREE" : `₹${deliveryFee}` },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between",
                fontSize: "0.84rem", color: INK_SOFT, marginBottom: 8 }}>
                <span>{row.label}</span>
                <span style={{ color: deliveryFee === 0 && i === 1 ? "#15803D" : INK_SOFT, fontWeight: deliveryFee === 0 && i === 1 ? 700 : 400 }}>
                  {row.value}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between",
              fontSize: "1rem", fontWeight: 700, color: INK,
              borderTop: `1px solid ${INK_HAIR}`, paddingTop: 12, marginTop: 4 }}>
              <span>Total</span>
              <span style={{ color: TC_DEEP, fontFamily: "var(--font-display)" }}>₹{grandTotal}</span>
            </div>
          </div>

          {/* ── Wallet balance indicator ── */}
          <div style={{
            marginTop: 16, padding: "12px 14px", borderRadius: 12,
            background: hasSufficientBalance ? `${VEG}08` : "#FEF2F2",
            border: `1px solid ${hasSufficientBalance ? `${VEG}20` : "#FECACA"}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Wallet size={16} style={{ color: hasSufficientBalance ? VEG : "#DC2626", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.78rem", color: hasSufficientBalance ? VEG : "#991B1B", fontWeight: 600 }}>
                Wallet balance: ₹{balance !== null ? Number(balance).toFixed(0) : "—"}
              </div>
              {!hasSufficientBalance && balance !== null && (
                <div style={{ fontSize: "0.72rem", color: "#DC2626", marginTop: 2 }}>
                  Need ₹{(grandTotal - balance).toFixed(0)} more
                </div>
              )}
            </div>
            {!hasSufficientBalance && (
              <button onClick={() => navigate("/wallet")} style={{
                padding: "6px 14px", borderRadius: 8, border: "none",
                background: TC, color: "#FFF5E6", fontSize: "0.72rem", fontWeight: 700,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Plus size={11} /> Add Funds
              </button>
            )}
          </div>

          {/* Insufficient balance warning */}
          {!hasSufficientBalance && balance !== null && (
            <div style={{
              marginTop: 10, padding: "10px 14px", borderRadius: 10,
              background: "#FFFBEB", border: "1px solid #FDE68A",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: "0.76rem", color: "#92400E",
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              Funds will be locked from your wallet when you place the order.
            </div>
          )}

          {/* Sufficient balance indicator */}
          {hasSufficientBalance && (
            <div style={{
              marginTop: 10, padding: "10px 14px", borderRadius: 10,
              background: FIELD,
              display: "flex", alignItems: "center", gap: 8,
              fontSize: "0.78rem", color: INK_SOFT,
            }}>
              <CreditCard size={14} style={{ color: TC }} />
              ₹{grandTotal} will be locked from your wallet until delivery
            </div>
          )}

          <button onClick={handlePlaceOrder}
            disabled={placing || addresses.length === 0 || !hasSufficientBalance}
            style={{
              width: "100%", padding: "16px", marginTop: 16, borderRadius: 12, border: "none",
              background: placing || addresses.length === 0 || !hasSufficientBalance
                ? "rgba(43,29,18,0.14)"
                : `linear-gradient(135deg, ${TC_SOFT}, ${TC} 55%, ${TC_DEEP})`,
              color: placing || addresses.length === 0 || !hasSufficientBalance ? INK_MUTED : "#FFF5E6",
              fontSize: "0.95rem", fontWeight: 600, fontFamily: "var(--font-sans)",
              cursor: placing || addresses.length === 0 || !hasSufficientBalance ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: placing ? "none" : `0 6px 20px ${TC}40`, transition: "all 0.2s",
            }}>
            {placing
              ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Placing order...</>
              : !hasSufficientBalance && balance !== null
                ? "Insufficient balance"
                : `Place order · ₹${grandTotal}`}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .checkout-grid > div:last-child { position: relative !important; top: auto !important; }
        }
      `}</style>
    </div>
  );
}
