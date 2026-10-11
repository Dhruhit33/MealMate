import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, LogOut, MapPin, ChevronDown, Search, X, Star, Clock, Wallet, Menu } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import { useRestaurantStore } from "../store/restaurantStore";
import CartPanel from "./CartPanel";

const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const CARD = "#FFF9EC";
const FIELD = "#F5EAD4";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_SOFT = "#E07848";
const TERRACOTTA_DEEP = "#8A2F18";
const CURRY = "#B5761A";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimerRef = useRef(null);
  const { searchRestaurants } = useRestaurantStore();

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  // Live search with debounce
  const handleSearchChange = useCallback((e) => {
    const q = e.target.value;
    setSearchQuery(q);
    
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    
    if (q.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/restaurants/search?query=${encodeURIComponent(q.trim())}`, {
          headers: {
            "Authorization": `Bearer ${useAuthStore.getState().token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data.slice(0, 6) : []);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 350);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      setSearchResults([]);
      setMobileMenuOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleLogout = () => { logout(); setMobileMenuOpen(false); navigate("/login"); };

  
  

  const NAV_LINKS = [
    { to: "/profile",   icon: User,        label: "My Profile"  },
    { to: "/addresses", icon: MapPin,      label: "Addresses"   },
    { to: "/orders",    icon: ShoppingBag, label: "My Orders"   },
    { to: "/wallet",    icon: Wallet,      label: "Wallet"      },
  ];

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250,243,231,0.88)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: `1px solid ${INK_HAIR}`,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 24px",
          height: 72, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 16,
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 60%, ${TERRACOTTA_DEEP})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700,
              color: "#FFF5E6", fontStyle: "italic", boxShadow: `0 4px 12px ${TERRACOTTA}35`,
            }}>f</div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: INK, letterSpacing: "-0.01em" }}>
              foodrush<span style={{ color: TERRACOTTA }}>.</span>
            </span>
          </Link>

          {/* Desktop search bar */}
          <div ref={searchRef} className="hide-mobile" style={{ flex: 1, maxWidth: 480, position: "relative" }}>
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} style={{ position: "relative" }}>
                <Search size={16} style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: TERRACOTTA, pointerEvents: "none",
                }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search restaurants, dishes, cuisines..."
                  style={{
                    width: "100%", padding: "11px 40px 11px 42px",
                    background: "#FFF", borderRadius: 12,
                    border: `1.5px solid ${TERRACOTTA}`,
                    fontSize: "0.9rem", fontFamily: "var(--font-sans)",
                    color: INK, outline: "none",
                    boxShadow: `0 0 0 3px ${TERRACOTTA}15, 0 4px 16px rgba(43,29,18,0.08)`,
                  }}
                />
                <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 4,
                    color: INK_MUTED, display: "flex", alignItems: "center",
                  }}>
                  <X size={16} />
                </button>

                {/* Search dropdown results */}
                {searchQuery.trim().length >= 2 && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                    background: "#FFFAF0", borderRadius: 16,
                    border: `1px solid ${INK_HAIR}`,
                    boxShadow: "0 16px 48px rgba(43,29,18,0.15)",
                    maxHeight: 400, overflowY: "auto",
                    animation: "scale-in 0.15s ease-out",
                  }}>
                    {searching ? (
                      <div style={{ padding: "20px 24px", textAlign: "center", color: INK_MUTED, fontSize: "0.88rem" }}>
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div style={{ padding: "20px 24px", textAlign: "center" }}>
                        <p style={{ color: INK_MUTED, fontSize: "0.88rem", marginBottom: 8 }}>
                          No results for "{searchQuery}"
                        </p>
                        <button type="submit" style={{
                          padding: "8px 16px", borderRadius: 999, border: "none",
                          background: `${TERRACOTTA}12`, color: TERRACOTTA_DEEP,
                          fontSize: "0.82rem", fontWeight: 600,
                          fontFamily: "var(--font-sans)", cursor: "pointer",
                        }}>Search all →</button>
                      </div>
                    ) : (
                      <div style={{ padding: 8 }}>
                        {searchResults.map((r) => (
                          <div
                            key={r.restaurantId}
                            onClick={() => {
                              setSearchOpen(false); setSearchQuery(""); setSearchResults([]);
                              navigate(`/restaurants/${r.restaurantId}`);
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = FIELD}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <div style={{
                              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                              background: r.imageUrl
                                ? `url(${r.imageUrl}) center/cover`
                                : `linear-gradient(135deg, ${TERRACOTTA}20, ${TERRACOTTA}08)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              overflow: "hidden",
                            }}>
                              {!r.imageUrl && (
                                <span style={{
                                  fontFamily: "var(--font-display)", fontSize: "1.2rem",
                                  fontWeight: 500, color: TERRACOTTA_DEEP, fontStyle: "italic",
                                }}>{r.name?.charAt(0)?.toUpperCase()}</span>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: "0.9rem", fontWeight: 600, color: INK,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>{r.name}</div>
                              <div style={{
                                fontSize: "0.75rem", color: INK_MUTED,
                                display: "flex", alignItems: "center", gap: 8,
                              }}>
                                <span>{r.cuisineType}</span>
                                {r.avgRating > 0 && (
                                  <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Star size={9} fill={CURRY} color={CURRY} />
                                    {Number(r.avgRating).toFixed(1)}
                                  </span>
                                )}
                                <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <Clock size={9} /> {r.avgDeliveryTimeMins || 30}min
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div style={{ borderTop: `1px solid ${INK_HAIR}`, padding: "8px 14px" }}>
                          <button type="submit" style={{
                            width: "100%", padding: "8px", borderRadius: 8, border: "none",
                            background: `${TERRACOTTA}08`, color: TERRACOTTA_DEEP,
                            fontSize: "0.82rem", fontWeight: 600,
                            fontFamily: "var(--font-sans)", cursor: "pointer",
                          }}>View all results for "{searchQuery}" →</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            ) : (
              <button onClick={openSearch} style={{
                width: "100%", padding: "10px 16px 10px 42px",
                background: FIELD, borderRadius: 12,
                border: `1.5px solid transparent`,
                fontSize: "0.88rem", fontFamily: "var(--font-sans)",
                color: INK_MUTED, cursor: "text", textAlign: "left",
                transition: "all 0.2s", position: "relative",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = INK_HAIR; e.currentTarget.style.background = CARD; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = FIELD; }}
              >
                <Search size={16} style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: INK_MUTED,
                }} />
                Search restaurants, dishes...
              </button>
            )}
          </div>

          {/* Desktop right actions */}
          <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Cart button */}
            <button onClick={() => setCartOpen(true)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 999, border: "none",
              background: itemCount > 0 ? TERRACOTTA : `${TERRACOTTA}0E`,
              color: itemCount > 0 ? "#FFF5E6" : TERRACOTTA_DEEP,
              cursor: "pointer", fontFamily: "var(--font-sans)",
              fontSize: "0.85rem", fontWeight: 600, transition: "all 0.2s",
              boxShadow: itemCount > 0 ? `0 4px 14px ${TERRACOTTA}45` : "none",
            }}>
              <ShoppingBag size={16} />
              Cart
              {itemCount > 0 && (
                <span style={{
                  minWidth: 18, height: 18, borderRadius: 999,
                  background: "#FFF5E6", color: TERRACOTTA_DEEP,
                  fontSize: "0.7rem", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 5px", animation: "scale-in 0.2s ease-out",
                }}>{itemCount}</span>
              )}
            </button>

            {/* User dropdown */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "5px 12px 5px 5px",
                borderRadius: 999, border: `1.5px solid ${INK_HAIR}`, background: CARD,
                cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.2s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = TERRACOTTA_SOFT)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = INK_HAIR)}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FFF5E6", fontSize: "0.78rem", fontWeight: 700,
                }}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
                <span style={{ fontSize: "0.85rem", fontWeight: 500, color: INK, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name?.split(" ")?.[0] || "User"}
                </span>
                <ChevronDown size={13} style={{ color: INK_MUTED, transition: "transform 0.2s", transform: menuOpen ? "rotate(180deg)" : "rotate(0)" }} />
              </button>

              {menuOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)", width: 220,
                  background: "#FFFAF0", borderRadius: 14, border: `1px solid ${INK_HAIR}`,
                  boxShadow: "0 14px 40px rgba(43,29,18,0.12)", padding: 6,
                  animation: "scale-in 0.15s ease-out",
                }}>
                  {NAV_LINKS.map((item) => (
                    <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                      borderRadius: 10, textDecoration: "none", color: INK,
                      fontSize: "0.88rem", fontWeight: 500, transition: "background 0.15s",
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = FIELD)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <item.icon size={15} style={{ color: INK_MUTED }} />
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ height: 1, background: INK_HAIR, margin: "4px 0" }} />
                  <button onClick={handleLogout} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: 10, width: "100%", border: "none", background: "transparent",
                    color: "#A83232", fontSize: "0.88rem", fontWeight: 500,
                    cursor: "pointer", fontFamily: "var(--font-sans)", transition: "background 0.15s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile right actions */}
          <div className="hide-desktop" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Mobile search */}
            <button onClick={() => { setMobileMenuOpen(false); navigate("/search"); }} style={{
              width: 38, height: 38, borderRadius: 10, border: "none",
              background: FIELD, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Search size={17} style={{ color: INK_MUTED }} />
            </button>

            {/* Cart button mobile */}
            <button onClick={() => setCartOpen(true)} style={{
              width: 38, height: 38, borderRadius: 10, border: "none",
              background: itemCount > 0 ? TERRACOTTA : FIELD,
              cursor: "pointer", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShoppingBag size={17} style={{ color: itemCount > 0 ? "#FFF5E6" : INK_MUTED }} />
              {itemCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  minWidth: 18, height: 18, borderRadius: 999,
                  background: "#FFF5E6", color: TERRACOTTA_DEEP,
                  fontSize: "0.65rem", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid rgba(250,243,231,0.88)`,
                }}>{itemCount}</span>
              )}
            </button>

            {/* Hamburger */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
              width: 38, height: 38, borderRadius: 10,
              border: `1.5px solid ${mobileMenuOpen ? TERRACOTTA : INK_HAIR}`,
              background: mobileMenuOpen ? `${TERRACOTTA}0C` : CARD,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {mobileMenuOpen
                ? <X size={17} style={{ color: TERRACOTTA_DEEP }} />
                : <Menu size={17} style={{ color: INK_SOFT }} />
              }
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div style={{
            padding: "8px 16px 16px",
            borderTop: `1px solid ${INK_HAIR}`,
            animation: "fade-up 0.2s ease-out",
          }}>
            {/* User info */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 0 16px",
              borderBottom: `1px solid ${INK_HAIR}`, marginBottom: 8,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFF5E6", fontSize: "1rem", fontWeight: 700,
              }}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: INK }}>{user?.name || "User"}</div>
                <div style={{ fontSize: "0.78rem", color: INK_MUTED }}>{user?.email}</div>
              </div>
            </div>

            {NAV_LINKS.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 8px",
                borderRadius: 10, textDecoration: "none", color: INK,
                fontSize: "0.92rem", fontWeight: 500,
              }}>
                <item.icon size={17} style={{ color: INK_MUTED }} />
                {item.label}
              </Link>
            ))}
            <div style={{ height: 1, background: INK_HAIR, margin: "8px 0" }} />
            <button onClick={handleLogout} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 8px",
              borderRadius: 10, width: "100%", border: "none", background: "transparent",
              color: "#A83232", fontSize: "0.92rem", fontWeight: 500,
              cursor: "pointer", fontFamily: "var(--font-sans)",
            }}>
              <LogOut size={17} /> Sign out
            </button>
          </div>
        )}
      </nav>

      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
