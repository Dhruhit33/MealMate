import { useEffect, useState } from "react";
import { Loader2, Plus, ArrowDownLeft, ArrowUpRight, Wallet, Lock, Unlock, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useWalletStore } from "../../store/walletStore";

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
const VEG = "#4A7C2B";
const SAFFRON = "#D4882A";

const QUICK_AMOUNTS = [100, 200, 500, 1000];

/**
 * Transaction type classification based on backend txnType enum:
 *  CREDIT  → money added to wallet
 *  LOCK    → funds locked for an order
 *  RELEASE → locked funds released (order cancelled / refund)
 *  DEBIT   → payment settled (money deducted after delivery)
 */
const TX_META = {
  CREDIT:  { label: "Money added",     color: VEG,            icon: ArrowDownLeft, sign: "+" },
  LOCK:    { label: "Funds locked",     color: SAFFRON,        icon: Lock,          sign: "−" },
  RELEASE: { label: "Funds released",   color: "#6D28D9",      icon: Unlock,        sign: "+" },
  DEBIT:   { label: "Payment settled",  color: TERRACOTTA_DEEP,icon: CreditCard,    sign: "−" },
};

function getTxMeta(tx) {
  // Backend sends txnType field (CREDIT, LOCK, RELEASE, DEBIT)
  const txnType = (tx.txnType || tx.type || tx.transactionType || "").toUpperCase();
  if (TX_META[txnType]) return TX_META[txnType];

  // Fallback classification
  if (txnType.includes("CREDIT") || txnType.includes("ADD") || txnType.includes("REFUND")) return TX_META.CREDIT;
  if (txnType.includes("LOCK")) return TX_META.LOCK;
  if (txnType.includes("RELEASE")) return TX_META.RELEASE;
  if (txnType.includes("DEBIT") || txnType.includes("PAY") || txnType.includes("ORDER") || txnType.includes("SETTLE")) return TX_META.DEBIT;
  return tx.amount > 0 ? TX_META.CREDIT : TX_META.DEBIT;
}

export default function WalletPage() {
  const {
    balance, lockedBalance, totalBalance,
    transactions, loading,
    fetchBalance, addFunds, fetchTransactions,
  } = useWalletStore();

  const [amount, setAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const handleAddFunds = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return toast.error("Enter a valid amount");
    if (num > 10000) return toast.error("Maximum ₹10,000 per transaction");
    setAdding(true);
    try {
      await addFunds(num);
      toast.success(`₹${num} added to wallet!`);
      setAmount("");
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add funds");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", animation: "fade-up 0.4s ease-out" }}>
      <h1 style={{
        fontFamily: "var(--font-display)", fontSize: "2rem",
        fontWeight: 500, letterSpacing: "-0.02em", color: INK, marginBottom: 28,
      }}>Wallet</h1>

      {/* Balance card */}
      <div style={{
        background: `linear-gradient(135deg, #1A1814 0%, #2D2520 100%)`,
        borderRadius: 22, padding: "36px 32px", marginBottom: 24,
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -40, right: -40, width: 180, height: 180,
          borderRadius: "50%", background: `${TERRACOTTA_SOFT}15`,
        }} />
        <div style={{
          position: "absolute", bottom: -60, right: 60, width: 220, height: 220,
          borderRadius: "50%", background: `${TERRACOTTA}10`,
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `${TERRACOTTA}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Wallet size={18} style={{ color: TERRACOTTA_SOFT }} />
            </div>
            <span style={{
              fontSize: "0.8rem", color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600,
            }}>FoodRush Wallet</span>
          </div>

          {/* Available balance */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
              Available balance
            </p>
            {loading && balance === null ? (
              <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "rgba(255,255,255,0.4)" }} />
            ) : (
              <div style={{
                fontFamily: "var(--font-display)", fontSize: "3rem",
                fontWeight: 500, color: "#FFF5E6", letterSpacing: "-0.03em",
                lineHeight: 1,
              }}>
                ₹{balance !== null ? Number(balance).toFixed(2) : "0.00"}
              </div>
            )}
          </div>

          {/* Locked + Total balance row */}
          {(lockedBalance > 0 || totalBalance > 0) && (
            <div style={{
              display: "flex", gap: 24, paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}>
              {lockedBalance > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <Lock size={11} style={{ color: SAFFRON }} />
                    <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                      Locked
                    </span>
                  </div>
                  <div style={{ fontSize: "1rem", color: SAFFRON, fontWeight: 600, fontFamily: "var(--font-display)" }}>
                    ₹{Number(lockedBalance).toFixed(2)}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>
                  Total
                </div>
                <div style={{ fontSize: "1rem", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontFamily: "var(--font-display)" }}>
                  ₹{totalBalance !== null ? Number(totalBalance).toFixed(2) : "0.00"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add funds */}
      <div style={{
        background: CARD, borderRadius: 18, border: `1px solid ${INK_HAIR}`,
        padding: "24px", marginBottom: 24,
      }}>
        <h2 style={{
          fontSize: "1rem", fontWeight: 700, color: INK, marginBottom: 18,
        }}>Add money</h2>

        {/* Quick amounts */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {QUICK_AMOUNTS.map((q) => (
            <button key={q} onClick={() => setAmount(String(q))} style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              border: `1.5px solid ${amount === String(q) ? TERRACOTTA : INK_HAIR}`,
              background: amount === String(q) ? `${TERRACOTTA}0C` : "transparent",
              color: amount === String(q) ? TERRACOTTA_DEEP : INK_SOFT,
              fontSize: "0.85rem", fontWeight: 600,
              fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.2s",
            }}>
              ₹{q}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <span style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            fontSize: "1rem", fontWeight: 600, color: focused ? TERRACOTTA : INK_MUTED,
            pointerEvents: "none", transition: "color 0.2s",
          }}>₹</span>
          <input
            type="number" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Enter amount"
            min={1} max={10000}
            style={{
              width: "100%", padding: "14px 16px 14px 34px",
              borderRadius: 12, border: `1.5px solid ${focused ? TERRACOTTA : "transparent"}`,
              background: focused ? FIELD_FOCUS : FIELD,
              fontSize: "1rem", fontFamily: "var(--font-sans)", color: INK,
              outline: "none", transition: "all 0.2s",
              boxShadow: focused ? `0 0 0 3px ${TERRACOTTA}12` : "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button onClick={handleAddFunds} disabled={adding || !amount} style={{
          width: "100%", padding: "14px", borderRadius: 12, border: "none",
          background: adding || !amount
            ? "rgba(43,29,18,0.12)"
            : `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
          color: adding || !amount ? INK_MUTED : "#FFF5E6",
          fontSize: "0.95rem", fontWeight: 600,
          fontFamily: "var(--font-sans)",
          cursor: adding || !amount ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s",
          boxShadow: adding || !amount ? "none" : `0 6px 18px ${TERRACOTTA}40`,
        }}>
          {adding
            ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            : <><Plus size={16} /> Add to wallet</>
          }
        </button>
      </div>

      {/* Transactions */}
      <div style={{
        background: CARD, borderRadius: 18, border: `1px solid ${INK_HAIR}`,
        padding: "24px",
      }}>
        <h2 style={{
          fontSize: "1rem", fontWeight: 700, color: INK, marginBottom: 18,
        }}>Transaction history</h2>

        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: INK_MUTED }}>
            <Wallet size={28} style={{ margin: "0 auto 10px", display: "block", opacity: 0.4 }} />
            <p style={{ fontSize: "0.88rem" }}>No transactions yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {transactions.map((tx, i) => {
              const meta = getTxMeta(tx);
              const Icon = meta.icon;
              const txDate = tx.createdAt || tx.timestamp
                ? new Date(tx.createdAt || tx.timestamp).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })
                : null;

              // Description: prefer backend description, then construct from type
              const description = tx.description || tx.remarks || meta.label;

              // Order reference
              const orderRef = tx.orderId
                ? ` · Order #${tx.orderId.slice(-6).toUpperCase()}`
                : "";

              return (
                <div key={tx.transactionId || i} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 0",
                  borderBottom: i < transactions.length - 1 ? `1px solid ${INK_HAIR}` : "none",
                  animation: `fade-up 0.3s ease-out ${i * 0.04}s both`,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: `${meta.color}12`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={16} style={{ color: meta.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: INK, marginBottom: 2 }}>
                      {description}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: INK_MUTED }}>
                      {txDate}{orderRef}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{
                      fontSize: "0.95rem", fontWeight: 700,
                      color: meta.color,
                    }}>
                      {meta.sign}₹{Math.abs(tx.amount).toFixed(0)}
                    </div>
                    {tx.balanceAfter !== undefined && tx.balanceAfter !== null && (
                      <div style={{ fontSize: "0.65rem", color: INK_MUTED, marginTop: 1 }}>
                        Bal: ₹{Number(tx.balanceAfter).toFixed(0)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
