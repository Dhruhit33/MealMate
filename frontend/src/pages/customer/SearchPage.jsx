import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, X, Star, Clock } from "lucide-react";
import { useRestaurantStore } from "../../store/restaurantStore";

const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const CARD = "#FFF9EC";
const TERRACOTTA = "#C14A2A";
const CURRY = "#B5761A";
const SAFFRON = "#D98B3E";
const PISTACHIO = "#6B7F4A";
const TERRACOTTA_DEEP = "#8A2F18";

const palettes = [
  { bg: "#F9DDC5", accent: TERRACOTTA },
  { bg: "#F4D9B8", accent: SAFFRON },
  { bg: "#DCE4C8", accent: PISTACHIO },
  { bg: "#F5CFC3", accent: TERRACOTTA_DEEP },
];
const paletteFor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length];
};

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") || "";
  const [query, setQuery] = useState(q);
  const { searchResults, loading, searchRestaurants } = useRestaurantStore();

  useEffect(() => { if (q) searchRestaurants(q); }, [q]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) setParams({ q: query.trim() });
  };

  const suggested = ["Biryani", "Pizza", "South Indian", "Desserts", "Chinese"];

  return (
    <div style={{ animation: "fade-up 0.4s ease-out both" }}>
      <Link to="/" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 999,
        border: `1px solid ${INK_HAIR}`, background: CARD,
        color: INK_SOFT, fontSize: "0.85rem", fontFamily: "var(--font-sans)",
        textDecoration: "none", marginBottom: 24,
      }}><ArrowLeft size={14} /> Back home</Link>

      <h1 style={{
        fontFamily: "var(--font-display)", fontSize: "2.4rem",
        fontWeight: 500, letterSpacing: "-0.02em", color: INK, marginBottom: 20,
      }}>
        {q ? <>Results for <span style={{ fontStyle: "italic", color: TERRACOTTA }}>"{q}"</span></> : "Search restaurants"}
      </h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 40 }}>
        <div style={{ position: "relative", maxWidth: 640 }}>
          <SearchIcon size={20} style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", color: INK_MUTED }} />
          <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for dishes, cuisines, or restaurants..."
            style={{
              width: "100%", padding: "18px 48px 18px 54px",
              background: CARD, border: `1.5px solid ${INK_HAIR}`, borderRadius: 16,
              fontSize: "1rem", fontFamily: "var(--font-sans)", color: INK, outline: "none",
            }}
            onFocus={(e) => { e.target.style.borderColor = TERRACOTTA; e.target.style.boxShadow = `0 0 0 4px ${TERRACOTTA}15`; }}
            onBlur={(e) => { e.target.style.borderColor = INK_HAIR; e.target.style.boxShadow = "none"; }}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setParams({}); }} style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: INK_MUTED, padding: 4,
            }}><X size={18} /></button>
          )}
        </div>
        {!q && (
          <div style={{ marginTop: 20 }}>
            <div style={{
              fontSize: "0.72rem", color: INK_MUTED,
              textTransform: "uppercase", letterSpacing: "0.12em",
              fontWeight: 600, marginBottom: 10,
            }}>Try searching for</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {suggested.map((s) => (
                <button key={s} type="button" onClick={() => { setQuery(s); setParams({ q: s }); }} style={{
                  padding: "8px 14px", borderRadius: 999,
                  border: `1px solid ${INK_HAIR}`, background: CARD,
                  color: INK_SOFT, fontSize: "0.82rem", fontFamily: "var(--font-sans)",
                  fontWeight: 500, cursor: "pointer",
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </form>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: INK_MUTED }}>Searching...</div>
      ) : q && searchResults.length === 0 ? (
        <div style={{
          padding: "60px 24px", textAlign: "center",
          background: CARD, borderRadius: 16, border: `1.5px dashed ${INK_HAIR}`,
        }}>
          <SearchIcon size={36} style={{ color: INK_MUTED, margin: "0 auto 14px", display: "block" }} />
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: 6 }}>No results for "{q}"</h3>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22 }}>
          {searchResults.map((r, i) => <SearchResultCard key={r.restaurantId} restaurant={r} index={i} onClick={() => navigate(`/restaurants/${r.restaurantId}`)} />)}
        </div>
      )}
      <style>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes shimmer { 0%{ background-position: -200% 0;} 100%{ background-position: 200% 0;} }
      `}</style>
    </div>
  );
}

function SearchResultCard({ restaurant, index, onClick }) {
  const r = restaurant;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const palette = paletteFor(r.name);
  return (
    <div onClick={onClick} style={{
      background: CARD, borderRadius: 18, border: `1px solid ${INK_HAIR}`,
      overflow: "hidden", cursor: "pointer",
      transition: "all 0.25s", animation: `fade-up 0.3s ease-out ${index * 0.04}s both`,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 18px 36px -12px rgba(43,29,18,0.15)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{
        height: 160, position: "relative",
        background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.accent}25 100%)`,
        overflow: "hidden",
      }}>
        {r.imageUrl && !imgError ? (
          <>
            {!imgLoaded && <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(90deg, ${palette.bg} 0%, ${palette.accent}20 50%, ${palette.bg} 100%)`,
              backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
            }} />}
            <img src={r.imageUrl} alt={r.name}
              onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s" }}
            />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "5rem",
              fontWeight: 500, color: palette.accent, fontStyle: "italic", opacity: 0.85,
            }}>{r.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
        {r.avgRating > 0 && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            padding: "4px 10px", borderRadius: 999,
            background: "rgba(255,250,240,0.95)", color: INK,
            fontSize: "0.78rem", fontWeight: 700,
            display: "flex", alignItems: "center", gap: 4,
            boxShadow: "0 2px 8px rgba(43,29,18,0.2)", backdropFilter: "blur(8px)",
          }}>
            <Star size={11} fill={CURRY} color={CURRY} /> {Number(r.avgRating).toFixed(1)}
          </div>
        )}
      </div>
      <div style={{ padding: "14px 18px 18px" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: INK, marginBottom: 4 }}>{r.name}</h3>
        <p style={{ fontSize: "0.8rem", color: INK_MUTED, marginBottom: 10 }}>{r.cuisineType}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.78rem", color: INK_SOFT }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={12} /> {r.avgDeliveryTimeMins || 30} min
          </span>
        </div>
      </div>
    </div>
  );
}
