import { Link } from "react-router-dom";
import { ShoppingBag, MapPin, Wallet, Heart } from "lucide-react";

const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_SOFT = "#E07848";
const TERRACOTTA_DEEP = "#8A2F18";

export default function Footer() {
  return (
    <footer style={{
      background: "#1A1814",
      color: "rgba(255,255,255,0.5)",
      padding: "48px 24px 28px",
      marginTop: "auto",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 40, marginBottom: 40,
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 60%, ${TERRACOTTA_DEEP})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700,
              color: "#FFF5E6", fontStyle: "italic",
            }}>f</div>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "1.3rem",
              color: "#FFF5E6", letterSpacing: "-0.01em",
            }}>
              foodrush<span style={{ color: TERRACOTTA }}>.</span>
            </span>
          </div>
          <p style={{
            fontSize: "0.85rem", lineHeight: 1.6,
            color: "rgba(255,255,255,0.4)", maxWidth: 280,
          }}>
            Real food from real kitchens. Delivered fast with love.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <div style={{
            fontSize: "0.72rem", textTransform: "uppercase",
            letterSpacing: "0.14em", fontWeight: 700,
            color: "rgba(255,255,255,0.3)", marginBottom: 16,
          }}>Quick links</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { to: "/", label: "Home" },
              { to: "/search", label: "Search restaurants" },
              { to: "/orders", label: "My orders" },
              { to: "/profile", label: "My profile" },
            ].map((l) => (
              <Link key={l.to} to={l.to} style={{
                color: "rgba(255,255,255,0.5)", textDecoration: "none",
                fontSize: "0.88rem", transition: "color 0.2s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#FFF5E6"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
              >{l.label}</Link>
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <div style={{
            fontSize: "0.72rem", textTransform: "uppercase",
            letterSpacing: "0.14em", fontWeight: 700,
            color: "rgba(255,255,255,0.3)", marginBottom: 16,
          }}>Account</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { to: "/wallet", label: "Wallet", icon: Wallet },
              { to: "/addresses", label: "Saved addresses", icon: MapPin },
              { to: "/orders", label: "Order history", icon: ShoppingBag },
            ].map((l) => (
              <Link key={l.label} to={l.to} style={{
                color: "rgba(255,255,255,0.5)", textDecoration: "none",
                fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 8,
                transition: "color 0.2s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#FFF5E6"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
              >
                <l.icon size={14} /> {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <div style={{
            fontSize: "0.72rem", textTransform: "uppercase",
            letterSpacing: "0.14em", fontWeight: 700,
            color: "rgba(255,255,255,0.3)", marginBottom: 16,
          }}>Get in touch</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.85rem" }}>
            <span>📧 support@foodrush.app</span>
            <span>📱 +91 98765 43210</span>
            <span>📍 Bhopal, India</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingTop: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>
          © {new Date().getFullYear()} FoodRush. Built with{" "}
          <Heart size={11} fill={TERRACOTTA} color={TERRACOTTA} style={{ display: "inline", verticalAlign: "-1px" }} />{" "}
          for food lovers.
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "Help"].map((t) => (
            <span key={t} style={{
              fontSize: "0.78rem", color: "rgba(255,255,255,0.3)",
              cursor: "pointer", transition: "color 0.2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
            >{t}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
