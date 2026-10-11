import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Clock, MapPin, ArrowLeft, Plus, Flame, MessageSquare, Search, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRestaurantStore } from "../../store/restaurantStore";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";

const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_FAINT = "rgba(43,29,18,0.14)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const CARD = "#FFF9EC";
const FIELD = "#F5EAD4";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_SOFT = "#E07848";
const TERRACOTTA_DEEP = "#8A2F18";
const SAFFRON = "#D98B3E";
const PISTACHIO = "#6B7F4A";
const CURRY = "#B5761A";
const VEG = "#4A7C2B";
const NONVEG = "#A83232";

const palettes = [
  { bg: "#F9DDC5", accent: TERRACOTTA },
  { bg: "#F4D9B8", accent: SAFFRON },
  { bg: "#E8D9BA", accent: CURRY },
  { bg: "#DCE4C8", accent: PISTACHIO },
  { bg: "#F5CFC3", accent: TERRACOTTA_DEEP },
];
const paletteFor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length];
};

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { current, categories, menuItems, reviews, loading, fetchRestaurant, submitReview } = useRestaurantStore();
  const [vegOnly, setVegOnly] = useState(false);
  const [menuQuery, setMenuQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const categoryRefs = useRef({});

  useEffect(() => {
    if (id) fetchRestaurant(id).catch(() => toast.error("Couldn't load restaurant"));
  }, [id]);

  const grouped = useMemo(() => {
    const filtered = menuItems.filter((item) => {
      if (vegOnly && !item.isVeg) return false;
      if (menuQuery && !item.name.toLowerCase().includes(menuQuery.toLowerCase())) return false;
      return true;
    });
    if (categories.length > 0) {
      return categories.map((cat) => ({
        ...cat,
        items: filtered.filter((item) => item.categoryId === cat.categoryId),
      })).filter((g) => g.items.length > 0);
    }
    return filtered.length > 0 ? [{ categoryId: "all", name: "Menu", items: filtered }] : [];
  }, [menuItems, categories, vegOnly, menuQuery]);

  useEffect(() => {
    if (grouped.length > 0 && !activeCategory) setActiveCategory(grouped[0].categoryId);
  }, [grouped]);

  const scrollToCategory = (catId) => {
    const el = categoryRefs.current[catId];
    if (el) {
      const offset = 180;
      window.scrollTo({ top: el.offsetTop - offset, behavior: "smooth" });
      setActiveCategory(catId);
    }
  };

  if (loading || !current) return <DetailSkeleton />;

  const r = current;
  const bestsellers = menuItems.filter((i) => i.isBestseller).slice(0, 4);

  return (
    <div style={{ paddingBottom: 80, animation: "fade-up 0.4s ease-out both" }}>
      <button onClick={() => navigate(-1)} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 999,
        border: `1px solid ${INK_HAIR}`, background: CARD,
        color: INK_SOFT, fontSize: "0.85rem", fontFamily: "var(--font-sans)",
        cursor: "pointer", marginBottom: 20, transition: "all 0.2s",
      }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = INK_MUTED; e.currentTarget.style.color = INK; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = INK_HAIR; e.currentTarget.style.color = INK_SOFT; }}
      ><ArrowLeft size={14} /> Back</button>

      {/* HERO with real image */}
      <RestaurantHero restaurant={r} />

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section style={{ marginTop: 48, marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Flame size={16} style={{ color: TERRACOTTA }} />
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: "1.4rem",
              fontWeight: 500, letterSpacing: "-0.01em", color: INK,
            }}>Bestsellers</h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}>
            {bestsellers.map((item) => <BestsellerCard key={item.itemId} item={item} />)}
          </div>
        </section>
      )}

      {/* MENU - sidebar + main */}
      <div className="menu-layout" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 32, marginTop: 48 }}>
        <aside className="menu-sidebar" style={{
          position: "sticky", top: 100, alignSelf: "flex-start",
          maxHeight: "calc(100vh - 120px)", overflowY: "auto",
        }}>
          <div style={{
            fontSize: "0.72rem", color: INK_MUTED,
            textTransform: "uppercase", letterSpacing: "0.12em",
            fontWeight: 600, marginBottom: 12,
          }}>Jump to</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {grouped.map((cat) => {
              const active = activeCategory === cat.categoryId;
              return (
                <button key={cat.categoryId} onClick={() => scrollToCategory(cat.categoryId)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 10, border: "none",
                  background: active ? `${TERRACOTTA}10` : "transparent",
                  color: active ? TERRACOTTA_DEEP : INK_SOFT,
                  fontFamily: "var(--font-sans)", fontSize: "0.88rem",
                  fontWeight: active ? 600 : 500, cursor: "pointer",
                  textAlign: "left", transition: "all 0.15s",
                  borderLeft: `2px solid ${active ? TERRACOTTA : "transparent"}`,
                  marginLeft: -2,
                }}>
                  <span>{cat.name}</span>
                  <span style={{ fontSize: "0.72rem", color: active ? TERRACOTTA : INK_MUTED, fontWeight: 500 }}>
                    {cat.items.length}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main>
          {/* Filter bar */}
          <div style={{
            position: "sticky", top: 80, zIndex: 5,
            background: CARD, padding: "14px 18px", borderRadius: 14,
            border: `1px solid ${INK_HAIR}`, marginBottom: 24,
            display: "flex", gap: 12, alignItems: "center",
            boxShadow: `0 4px 12px rgba(43,29,18,0.04)`,
          }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={16} style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: INK_MUTED, pointerEvents: "none",
              }} />
              <input value={menuQuery} onChange={(e) => setMenuQuery(e.target.value)}
                placeholder="Search within menu..."
                style={{
                  width: "100%", padding: "10px 14px 10px 40px",
                  background: FIELD, border: "none", borderRadius: 10,
                  fontSize: "0.88rem", fontFamily: "var(--font-sans)",
                  color: INK, outline: "none",
                }}
              />
            </div>
            <button onClick={() => setVegOnly(!vegOnly)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 14px", borderRadius: 10,
              border: `1.5px solid ${vegOnly ? VEG : INK_HAIR}`,
              background: vegOnly ? `${VEG}10` : "transparent",
              color: vegOnly ? VEG : INK_SOFT,
              fontFamily: "var(--font-sans)", fontSize: "0.82rem",
              fontWeight: 600, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
              <VegIcon active={vegOnly} size={14} /> Veg only
            </button>
          </div>

          {grouped.length === 0 ? (
            <EmptyMenu query={menuQuery} vegOnly={vegOnly} />
          ) : (
            grouped.map((cat) => (
              <section key={cat.categoryId}
                ref={(el) => (categoryRefs.current[cat.categoryId] = el)}
                style={{ marginBottom: 48, scrollMarginTop: 180 }}
              >
                <div style={{
                  display: "flex", alignItems: "baseline", gap: 10,
                  marginBottom: 18, paddingBottom: 14,
                  borderBottom: `1px solid ${INK_HAIR}`,
                }}>
                  <h2 style={{
                    fontFamily: "var(--font-display)", fontSize: "1.7rem",
                    fontWeight: 500, letterSpacing: "-0.02em", color: INK,
                  }}>{cat.name}</h2>
                  <span style={{ fontSize: "0.8rem", color: INK_MUTED }}>
                    {cat.items.length} {cat.items.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <div>{cat.items.map((item, i) => <MenuItemRow key={item.itemId} item={item} index={i} restaurantId={r.restaurantId} restaurantName={r.name} />)}</div>
              </section>
            ))
          )}

          {/* Reviews section */}
          <ReviewsSection
            reviews={reviews}
            restaurantId={r.restaurantId}
            userName={user?.name}
            submitReview={submitReview}
          />
        </main>
      </div>

      <style>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes shimmer { 0%{ background-position: -200% 0;} 100%{ background-position: 200% 0;} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes scale-in { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @media (max-width: 768px) {
          .menu-layout {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }
          .menu-sidebar {
            display: none !important;
          }
          .menu-filter-bar {
            flex-wrap: wrap !important;
          }
          .menu-row {
            flex-direction: column !important;
            gap: 14px !important;
          }
          .menu-row-image {
            width: 100% !important;
            height: 180px !important;
          }
          .menu-row-add {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            transform: none !important;
            margin-top: 4px !important;
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}

// ────── Hero ──────
function RestaurantHero({ restaurant }) {
  const r = restaurant;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const palette = paletteFor(r.name);

  return (
    <div style={{
      position: "relative", borderRadius: 24, overflow: "hidden",
      background: palette.bg,
      border: `1px solid ${INK_HAIR}`,
      boxShadow: `0 2px 4px ${INK_HAIR}, 0 20px 48px -20px rgba(43,29,18,0.18)`,
    }}>
      {/* Image/banner */}
      <div style={{
        position: "relative", height: 280,
        background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.accent}30 100%)`,
      }}>
        {r.imageUrl && !imgError ? (
          <>
            {!imgLoaded && (
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(90deg, ${palette.bg} 0%, ${palette.accent}20 50%, ${palette.bg} 100%)`,
                backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
              }} />
            )}
            <img src={r.imageUrl} alt={r.name}
              onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", opacity: imgLoaded ? 1 : 0, transition: "opacity 0.5s",
              }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(43,29,18,0.45) 100%)",
            }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "12rem",
              fontWeight: 500, color: palette.accent,
              fontStyle: "italic", opacity: 0.85, lineHeight: 0.8,
            }}>{r.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}

        {/* Open/closed pill */}
        <div style={{
          position: "absolute", top: 18, right: 18,
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 999,
          background: "rgba(255,250,240,0.95)",
          backdropFilter: "blur(8px)",
          color: r.isOpen ? VEG : NONVEG,
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: r.isOpen ? VEG : NONVEG,
          }} />
          {r.isOpen ? "Open now" : "Closed"}
        </div>
      </div>

      {/* Info block */}
      <div style={{ padding: "28px 36px 32px", background: CARD }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "2.8rem",
          fontWeight: 500, letterSpacing: "-0.02em",
          lineHeight: 1.05, color: INK, marginBottom: 10,
        }}>{r.name}</h1>

        <p style={{
          fontSize: "1rem", color: INK_SOFT,
          lineHeight: 1.55, marginBottom: 16, maxWidth: 720,
        }}>{r.description || `Serving authentic ${r.cuisineType} cuisine with heart.`}</p>

        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          color: INK_MUTED, fontSize: "0.85rem", marginBottom: 22,
        }}>
          <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>{r.address}</span>
        </div>

        <div style={{
          display: "flex", gap: 0, padding: "18px 0 0",
          borderTop: `1px solid ${INK_HAIR}`, flexWrap: "wrap",
        }}>
          <HeroMetric icon={Star}
            value={r.avgRating > 0 ? Number(r.avgRating).toFixed(1) : "New"}
            label={r.totalReviews > 0 ? `${r.totalReviews} reviews` : "Just listed"}
            color={CURRY} filled first
          />
          <HeroMetric icon={Clock} value={`${r.avgDeliveryTimeMins || 30}`} suffix="min" label="Avg. delivery" color={SAFFRON} />
          <HeroMetric value={r.cuisineType} label="Cuisine" color={PISTACHIO} textOnly />
          {r.minOrderAmount > 0 && (
            <HeroMetric value={`₹${r.minOrderAmount}`} label="Min order" color={TERRACOTTA} textOnly />
          )}
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ icon: Icon, value, suffix, label, color, filled, first, textOnly }) {
  return (
    <div style={{
      flex: "1 1 140px", paddingLeft: first ? 0 : 20,
      borderLeft: first ? "none" : `1px solid ${INK_HAIR}`,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        {Icon && <Icon size={14} style={{ color, marginRight: 2, alignSelf: "center" }} fill={filled ? color : "none"} />}
        <span style={{
          fontFamily: textOnly ? "var(--font-sans)" : "var(--font-display)",
          fontSize: textOnly ? "1.05rem" : "1.5rem",
          fontWeight: textOnly ? 600 : 500,
          color: INK, letterSpacing: "-0.01em",
        }}>{value}</span>
        {suffix && <span style={{ fontSize: "0.78rem", color, fontWeight: 600 }}>{suffix}</span>}
      </div>
      <div style={{
        fontSize: "0.68rem", color: INK_MUTED,
        textTransform: "uppercase", letterSpacing: "0.08em",
        marginTop: 3, fontWeight: 500,
      }}>{label}</div>
    </div>
  );
}

// ────── Veg/Non-veg icons ──────
function VegIcon({ active = true, size = 14 }) {
  const color = active ? VEG : INK_MUTED;
  return (
    <span style={{
      width: size, height: size, border: `1.5px solid ${color}`,
      borderRadius: 2, display: "inline-flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ width: size - 8, height: size - 8, borderRadius: "50%", background: color }} />
    </span>
  );
}
function NonVegIcon({ size = 14 }) {
  return (
    <span style={{
      width: size, height: size, border: `1.5px solid ${NONVEG}`,
      borderRadius: 2, display: "inline-flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{
        width: 0, height: 0,
        borderLeft: `${(size - 6) / 2}px solid transparent`,
        borderRight: `${(size - 6) / 2}px solid transparent`,
        borderBottom: `${size - 6}px solid ${NONVEG}`,
      }} />
    </span>
  );
}

// ────── Bestseller card ──────
function BestsellerCard({ item }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const palette = paletteFor(item.name);

  return (
    <div style={{
      background: CARD, borderRadius: 14, border: `1px solid ${INK_HAIR}`,
      overflow: "hidden", transition: "all 0.2s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = TERRACOTTA_SOFT; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = INK_HAIR; }}
    >
      <div style={{
        height: 120, position: "relative",
        background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.accent}25 100%)`,
        overflow: "hidden",
      }}>
        {item.imageUrl && !imgError ? (
          <>
            {!imgLoaded && <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(90deg, ${palette.bg} 0%, ${palette.accent}20 50%, ${palette.bg} 100%)`,
              backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
            }} />}
            <img src={item.imageUrl} alt={item.name}
              onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s",
              }}
            />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "4rem",
              fontWeight: 500, color: palette.accent, fontStyle: "italic", opacity: 0.85,
            }}>{item.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
        <div style={{
          position: "absolute", top: 8, left: 8,
          display: "inline-flex", alignItems: "center", gap: 3,
          padding: "3px 8px", borderRadius: 4,
          background: "rgba(255,250,240,0.95)", color: TERRACOTTA_DEEP,
          fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em",
          textTransform: "uppercase", backdropFilter: "blur(8px)",
        }}>
          <Flame size={9} /> Bestseller
        </div>
      </div>
      <div style={{ padding: "12px 16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          {item.isVeg ? <VegIcon size={11} /> : <NonVegIcon size={11} />}
          <span style={{
            fontSize: "0.88rem", fontWeight: 600, color: INK,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{item.name}</span>
        </div>
        <div style={{ fontSize: "0.85rem", color: TERRACOTTA_DEEP, fontWeight: 700, fontFamily: "var(--font-display)" }}>₹{item.price}</div>
      </div>
    </div>
  );
}

// ────── Menu row with image ──────
function MenuItemRow({ item, index, restaurantId, restaurantName }) {
  const [added, setAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [pendingConflict, setPendingConflict] = useState(null);
  const { addItem, clearAndAdd } = useCartStore();
  const palette = paletteFor(item.name);

  const handleAdd = async () => {
    if (!item.isAvailable) return toast.error("Sorry, currently unavailable");
    const result = await addItem(item, restaurantId, restaurantName);
    if (result.conflict) {
      setPendingConflict(result.existingRestaurant);
      setShowConflict(true);
      return;
    }
    setAdded(true);
    toast.success(`${item.name} added to cart`);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleConfirmClear = async () => {
    await clearAndAdd(item, restaurantId, restaurantName);
    setShowConflict(false);
    setAdded(true);
    toast.success(`Cart cleared. ${item.name} added!`);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div style={{
      display: "flex", gap: 20, padding: "20px 0",
      borderBottom: `1px solid ${INK_HAIR}`,
      animation: `fade-up 0.3s ease-out ${index * 0.03}s both`,
      opacity: item.isAvailable ? 1 : 0.5,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          {item.isVeg ? <VegIcon size={13} /> : <NonVegIcon size={13} />}
          {item.isBestseller && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              padding: "2px 7px", borderRadius: 4,
              background: `${TERRACOTTA}12`, color: TERRACOTTA_DEEP,
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              <Flame size={9} /> Bestseller
            </span>
          )}
        </div>
        <h3 style={{
          fontSize: "1rem", fontWeight: 600, color: INK, marginBottom: 4,
          letterSpacing: "-0.005em",
        }}>{item.name}</h3>
        <div style={{
          fontSize: "1rem", fontWeight: 700, color: INK, marginBottom: 8,
          fontFamily: "var(--font-display)",
        }}>₹{item.price}</div>
        {item.description && (
          <p style={{ fontSize: "0.85rem", color: INK_SOFT, lineHeight: 1.5, maxWidth: 520 }}>{item.description}</p>
        )}
      </div>

      {/* Qty controls */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, position: "relative" }}>
        <div style={{
          width: 130, height: 130, borderRadius: 14,
          background: `linear-gradient(135deg, ${palette.bg}, ${palette.accent}30)`,
          overflow: "hidden", position: "relative",
        }}>
          {item.imageUrl && !imgError ? (
            <>
              {!imgLoaded && <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(90deg, ${palette.bg} 0%, ${palette.accent}20 50%, ${palette.bg} 100%)`,
                backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
              }} />}
              <img src={item.imageUrl} alt={item.name}
                onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s",
                }}
              />
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <span style={{
                fontFamily: "var(--font-display)", fontSize: "3.2rem",
                fontWeight: 500, color: palette.accent, fontStyle: "italic", opacity: 0.85,
                lineHeight: 0.8,
              }}>{item.name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
        </div>

        <button onClick={handleAdd} disabled={!item.isAvailable} style={{
          position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)",
          padding: "7px 22px", borderRadius: 999, border: `1.5px solid ${added ? VEG : TERRACOTTA}`,
          background: added ? VEG : "#FFFAF0",
          color: added ? "#FFF5E6" : TERRACOTTA_DEEP,
          fontSize: "0.78rem", fontWeight: 700,
          fontFamily: "var(--font-sans)",
          cursor: item.isAvailable ? "pointer" : "not-allowed",
          boxShadow: "0 4px 12px rgba(43,29,18,0.18)",
          display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s",
          letterSpacing: "0.03em",
        }}>
          {added ? "Added" : <><Plus size={13} strokeWidth={2.5} /> ADD</>}
        </button>
      </div>

      {/* Cart cross-restaurant conflict modal */}
      {showConflict && (
        <div onClick={() => setShowConflict(false)} style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(43,29,18,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, animation: "fade-in 0.2s ease-out",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#FFFAF0", borderRadius: 20, padding: "32px 28px",
            maxWidth: 380, width: "100%",
            boxShadow: "0 20px 60px rgba(43,29,18,0.25)",
            animation: "scale-in 0.2s ease-out",
          }}>
            <div style={{ fontSize: "2rem", textAlign: "center", marginBottom: 12 }}>🍽️</div>
            <h3 style={{
              fontFamily: "var(--font-display)", fontSize: "1.3rem",
              fontWeight: 500, color: INK, marginBottom: 10, textAlign: "center",
            }}>Replace cart items?</h3>
            <p style={{ fontSize: "0.88rem", color: INK_SOFT, textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
              Your cart contains items from <strong>{pendingConflict}</strong>. Adding this item will clear your existing cart.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowConflict(false)} style={{
                flex: 1, padding: "12px", borderRadius: 12,
                border: `1px solid ${INK_HAIR}`, background: "transparent",
                color: INK_SOFT, fontSize: "0.88rem", fontWeight: 500,
                fontFamily: "var(--font-sans)", cursor: "pointer",
              }}>Keep current</button>
              <button onClick={handleConfirmClear} style={{
                flex: 1, padding: "12px", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
                color: "#FFF5E6", fontSize: "0.88rem", fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                boxShadow: `0 4px 14px ${TERRACOTTA}40`,
              }}>Yes, start fresh</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────── Reviews section with submission ──────
function ReviewsSection({ reviews, restaurantId, userName, submitReview }) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Please select a rating");
    if (comment.trim().length < 5) return toast.error("Please write at least a few words");
    setSubmitting(true);
    try {
      await submitReview(restaurantId, rating, comment);
      toast.success("Thanks for your review!");
      setShowForm(false);
      setRating(0);
      setComment("");
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ marginTop: 64 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 22, gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MessageSquare size={18} style={{ color: TERRACOTTA }} />
          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: "1.7rem",
            fontWeight: 500, letterSpacing: "-0.02em", color: INK,
          }}>What people are saying</h2>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            padding: "9px 16px", borderRadius: 999,
            border: `1.5px solid ${TERRACOTTA}`, background: "transparent",
            color: TERRACOTTA_DEEP, fontSize: "0.82rem", fontWeight: 600,
            fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = TERRACOTTA; e.currentTarget.style.color = "#FFF5E6"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TERRACOTTA_DEEP; }}
          >Write a review</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: CARD, borderRadius: 14, border: `1px solid ${INK_HAIR}`,
          padding: "22px 24px", marginBottom: 20,
          animation: "fade-up 0.3s ease-out both",
        }}>
          <div style={{
            fontSize: "0.72rem", color: INK_MUTED,
            textTransform: "uppercase", letterSpacing: "0.12em",
            fontWeight: 600, marginBottom: 10,
          }}>Your rating</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (hoverRating || rating) >= n;
              return (
                <button key={n} type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <Star size={28}
                    fill={filled ? CURRY : "none"}
                    color={filled ? CURRY : INK_FAINT}
                    strokeWidth={1.5}
                  />
                </button>
              );
            })}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience — the food, the delivery, the little details..."
            rows={4}
            style={{
              width: "100%", padding: "14px 16px",
              background: FIELD, border: `1.5px solid transparent`,
              borderRadius: 10, fontSize: "0.92rem",
              fontFamily: "var(--font-sans)", color: INK,
              outline: "none", resize: "vertical",
              transition: "all 0.2s",
            }}
            onFocus={(e) => { e.target.style.borderColor = TERRACOTTA; e.target.style.background = "#FFF"; }}
            onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.background = FIELD; }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setShowForm(false)} style={{
              padding: "10px 18px", borderRadius: 999, border: `1px solid ${INK_HAIR}`,
              background: "transparent", color: INK_SOFT, fontSize: "0.85rem", fontWeight: 500,
              fontFamily: "var(--font-sans)", cursor: "pointer",
            }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{
              padding: "10px 20px", borderRadius: 999, border: "none",
              background: submitting ? INK_FAINT : `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
              color: "#FFF5E6", fontSize: "0.85rem", fontWeight: 600,
              fontFamily: "var(--font-sans)", cursor: submitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: submitting ? "none" : `0 4px 14px ${TERRACOTTA}40`,
            }}>
              {submitting ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <><Send size={14} /> Post review</>}
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div style={{
          padding: "40px 24px", textAlign: "center",
          background: CARD, borderRadius: 14, border: `1.5px dashed ${INK_HAIR}`,
        }}>
          <p style={{ fontSize: "0.9rem", color: INK_SOFT }}>Be the first to review!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {reviews.slice(0, 8).map((rev) => <ReviewCard key={rev.reviewId} review={rev} />)}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

function ReviewCard({ review }) {
  const initial = (review.userName || "A").charAt(0).toUpperCase();
  return (
    <div style={{
      background: CARD, borderRadius: 14, border: `1px solid ${INK_HAIR}`,
      padding: "18px 22px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#FFF5E6", fontSize: "0.88rem", fontWeight: 700, flexShrink: 0,
        }}>{initial}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: INK }}>{review.userName || "Anonymous"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} size={12}
                fill={n <= review.rating ? CURRY : "none"}
                color={n <= review.rating ? CURRY : INK_FAINT}
              />
            ))}
          </div>
        </div>
      </div>
      {review.comment && <p style={{ fontSize: "0.9rem", color: INK_SOFT, lineHeight: 1.55 }}>{review.comment}</p>}
    </div>
  );
}

function EmptyMenu({ query, vegOnly }) {
  return (
    <div style={{
      padding: "60px 24px", textAlign: "center",
      background: CARD, borderRadius: 16, border: `1.5px dashed ${INK_HAIR}`,
    }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 6, color: INK }}>No items match your filters</h3>
      <p style={{ fontSize: "0.85rem", color: INK_SOFT }}>
        {query && `Nothing found for "${query}". `}{vegOnly && "Try turning off veg-only mode."}
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div style={{ animation: "fade-up 0.3s ease-out" }}>
      <div style={{
        height: 400, borderRadius: 24, marginBottom: 32,
        background: `linear-gradient(90deg, ${FIELD} 0%, ${INK_HAIR} 50%, ${FIELD} 100%)`,
        backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
      }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            height: 100, borderRadius: 12,
            background: `linear-gradient(90deg, ${FIELD} 0%, ${INK_HAIR} 50%, ${FIELD} 100%)`,
            backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
          }} />
        ))}
      </div>
      <style>{`@keyframes shimmer { 0%{ background-position: -200% 0;} 100%{ background-position: 200% 0;} }`}</style>
    </div>
  );
}
