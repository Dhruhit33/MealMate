import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock, TrendingUp, Flame, ChefHat, Zap, Sparkles, MapPin, Navigation, Compass, AlertCircle, RefreshCw, Bike, ShieldCheck } from "lucide-react";
import { useRestaurantStore } from "../../store/restaurantStore";
import { useAuthStore } from "../../store/authStore";
import { useAddressStore, getAddressCoords } from "../../store/addressStore";

const INK        = "#1C1208";
const INK_SOFT   = "rgba(28,18,8,0.58)";
const INK_MUTED  = "rgba(28,18,8,0.38)";
const INK_HAIR   = "rgba(28,18,8,0.07)";
const CREAM      = "#FEFCF8";
const CARD       = "#FFF9EE";
const FIELD      = "#F5ECD8";
const TC         = "#C0401E";
const TC_SOFT    = "#DE6A40";
const TC_DEEP    = "#8B2910";
const SAFFRON    = "#D4882A";
const PISTACHIO  = "#5A7040";
const CURRY      = "#A86C10";

const CUISINES = [
  { label:"All",          emoji:"🍽" },
  { label:"North Indian", emoji:"🍛" },
  { label:"South Indian", emoji:"🥘" },
  { label:"Chinese",      emoji:"🥡" },
  { label:"Biryani",      emoji:"🍚" },
  { label:"Italian",      emoji:"🍕" },
  { label:"Desserts",     emoji:"🍮" },
  { label:"Continental",  emoji:"🥗" },
];

const PRESET_LOCATIONS = [
  { name: "Annapurnadham, Adalaj", lat: 23.1644, lng: 72.5855, tag: "Home" },
  { name: "Balapir Char Rasta",    lat: 23.1645, lng: 72.5811, tag: "Adalaj" },
  { name: "Infocity, Gandhinagar", lat: 23.1930, lng: 72.6300, tag: "Gandhinagar" },
  { name: "Vaishnodevi Circle",    lat: 23.1340, lng: 72.5450, tag: "SG Highway" },
  { name: "Chandkheda / Motera",  lat: 23.1000, lng: 72.5880, tag: "Ahmedabad" },
];

const PROMPTS = [
  "Craving something spicy tonight? 🌶",
  "Biryani o'clock — are we doing this?",
  "Your stomach called. It wants hot fresh food.",
  "Late-night munchies? We've got you. 🌙",
  "All delicious restaurants within 25 km of your location.",
  "One click away from happiness. 🍜",
];

const palettes = [
  { bg:"#F9DEC4", accent:TC },
  { bg:"#F4D8B6", accent:SAFFRON },
  { bg:"#E8D8B8", accent:CURRY },
  { bg:"#DAE2C6", accent:PISTACHIO },
  { bg:"#F4CCBE", accent:TC_DEEP },
];
const paletteFor = (name="") => {
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))>>>0;
  return palettes[h%palettes.length];
};

export default function HomePage() {
  const navigate  = useNavigate();
  const user      = useAuthStore(s=>s.user);
  const { topRated, nearby, loading, availableDrivers, fetchTopRated, fetchNearby, fetchAvailableDrivers, setLocation } = useRestaurantStore();
  const { addresses, selectedAddressId, selectAddress, fetchAddresses } = useAddressStore();
  const [cuisine, setCuisine]     = useState("All");
  const [promptIdx, setPromptIdx] = useState(0);

  const [activeLoc, setActiveLoc] = useState(PRESET_LOCATIONS[0]);
  const [gpsNotice, setGpsNotice] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  // Initialize location: if user has chosen/saved addresses, use active address; else fallback to Adalaj hub
  useEffect(() => {
    fetchAddresses().then((addrs) => {
      const savedId = localStorage.getItem("mealmate_selected_address_id");
      const chosen = (addrs || []).find(a => a.addressId === savedId) || (addrs && addrs.length > 0 ? addrs[0] : null);
      if (chosen) {
        const coords = getAddressCoords(chosen);
        const name = chosen.city ? `${chosen.label ? chosen.label + ": " : ""}${chosen.city}` : (chosen.street || chosen.label);
        const locObj = { name, lat: coords.lat, lng: coords.lng, tag: chosen.city || "Address", addressId: chosen.addressId };
        setActiveLoc(locObj);
        setLocation(name, coords.lat, coords.lng, 25, chosen.addressId);
        fetchTopRated(coords.lat, coords.lng, 25);
        fetchNearby(coords.lat, coords.lng, 25);
        fetchAvailableDrivers(coords.lat, coords.lng, 25);
      } else {
        setLocation(activeLoc.name, activeLoc.lat, activeLoc.lng, 25, null);
        fetchTopRated(activeLoc.lat, activeLoc.lng, 25);
        fetchNearby(activeLoc.lat, activeLoc.lng, 25);
        fetchAvailableDrivers(activeLoc.lat, activeLoc.lng, 25);
      }
    });
  }, []);

  // Rotate catchy prompt every 3.2s
  useEffect(()=>{
    const t = setInterval(()=>setPromptIdx(i=>(i+1)%PROMPTS.length), 3200);
    return ()=>clearInterval(t);
  },[]);

  // Switch to user's chosen address (e.g., Ahmedabad, Surat, Rajkot)
  const handleSelectUserAddress = useCallback(async (addr) => {
    const coords = getAddressCoords(addr);
    const name = addr.city ? `${addr.label ? addr.label + ": " : ""}${addr.city}` : (addr.street || addr.label);
    const locObj = { name, lat: coords.lat, lng: coords.lng, tag: addr.city || "Address", addressId: addr.addressId };
    setActiveLoc(locObj);
    setGpsNotice("");
    setLocLoading(true);
    selectAddress(addr);
    await Promise.all([
      fetchNearby(coords.lat, coords.lng, 25),
      fetchTopRated(coords.lat, coords.lng, 25),
    ]);
    fetchAvailableDrivers(coords.lat, coords.lng, 25);
    setLocLoading(false);
  }, [selectAddress, fetchNearby, fetchTopRated, fetchAvailableDrivers]);

  // Switch to selected preset location
  const handleSelectLocation = useCallback(async (loc) => {
    setActiveLoc(loc);
    setGpsNotice("");
    setLocLoading(true);
    setLocation(loc.name, loc.lat, loc.lng, 25, null);
    await Promise.all([
      fetchNearby(loc.lat, loc.lng, 25),
      fetchTopRated(loc.lat, loc.lng, 25),
    ]);
    fetchAvailableDrivers(loc.lat, loc.lng, 25);
    setLocLoading(false);
  }, [setLocation, fetchNearby, fetchTopRated, fetchAvailableDrivers]);

  // Request browser GPS (max 25 km radius)
  const handleUseGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsNotice("Geolocation is not supported by your browser. Using Annapurnadham, Adalaj.");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const results = await fetchNearby(lat, lng, 25);
        fetchTopRated(lat, lng, 25);
        fetchAvailableDrivers(lat, lng, 25);
        if (results && results.length > 0) {
          const locObj = { name: `My GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`, lat, lng, tag: "GPS" };
          setActiveLoc(locObj);
          setLocation(locObj.name, lat, lng, 25, null);
          setGpsNotice("");
        } else {
          // If browser ISP is outside Gujarat delivery area, gently notify and fallback to Adalaj
          setGpsNotice(`Your detected GPS (${lat.toFixed(2)}, ${lng.toFixed(2)}) has no registered restaurants within 25 km. Displaying restaurants near Annapurnadham, Adalaj.`);
          await Promise.all([
            fetchNearby(23.1644, 72.5855, 25),
            fetchTopRated(23.1644, 72.5855, 25),
          ]);
          setActiveLoc(PRESET_LOCATIONS[0]);
          setLocation(PRESET_LOCATIONS[0].name, 23.1644, 72.5855, 25, null);
        }
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        setGpsNotice("Could not access GPS. Displaying restaurants near Annapurnadham, Adalaj.");
        fetchNearby(23.1644, 72.5855, 25);
        fetchTopRated(23.1644, 72.5855, 25);
        fetchAvailableDrivers(23.1644, 72.5855, 25);
      },
      { timeout: 7000 }
    );
  }, [setLocation, fetchNearby, fetchTopRated, fetchAvailableDrivers]);

  // Strictly enforce 25km radius: only restaurants located within 25 km of activeLoc
  const all = useMemo(() => {
    const map = new Map();
    (nearby || []).forEach(r => {
      if (r && r.restaurantId && (r.distanceKm == null || r.distanceKm <= 25)) {
        map.set(r.restaurantId, r);
      }
    });
    (topRated || []).forEach(r => {
      if (r && r.restaurantId && !map.has(r.restaurantId) && (r.distanceKm == null || r.distanceKm <= 25)) {
        map.set(r.restaurantId, r);
      }
    });
    return Array.from(map.values());
  }, [nearby, topRated]);

  const featured = nearby[0] || all[0];

  const filtered = useMemo(() => {
    if (cuisine === "All") return all;
    return all.filter(r => {
      if (!r.cuisineType) return true;
      const rC = r.cuisineType.toLowerCase();
      const cC = cuisine.toLowerCase();
      return rC.includes(cC) || cC.includes(rC) ||
        (cC.includes("north") && rC.includes("nort")) ||
        (cC.includes("italian") && (rC.includes("italian") || r.name?.toLowerCase().includes("pizza") || r.name?.toLowerCase().includes("pizzariya")));
    });
  }, [all, cuisine]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  return (
    <div style={{ paddingBottom:100, position:"relative" }}>

      {/* ── Ambient blobs ── */}
      <div style={{ position:"absolute", top:-100, right:-180, width:600, height:600, borderRadius:"50%",
        background:`radial-gradient(circle,${TC_SOFT}16 0%,transparent 65%)`,
        filter:"blur(80px)", pointerEvents:"none", zIndex:-1 }} />
      <div style={{ position:"absolute", top:400, left:-200, width:500, height:500, borderRadius:"50%",
        background:`radial-gradient(circle,${SAFFRON}12 0%,transparent 65%)`,
        filter:"blur(80px)", pointerEvents:"none", zIndex:-1 }} />

      {/* ── HERO ── */}
      <section style={{ marginBottom:36, animation:"fade-up 0.6s cubic-bezier(0.2,0.8,0.2,1) both" }}>
        {/* Live pill */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          padding:"5px 14px", borderRadius:999,
          background:`${TC}0D`, border:`1px solid ${TC}22`,
          marginBottom:18,
        }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:TC, animation:"pulse-dot 2s ease-in-out infinite" }} />
          <span style={{ fontSize:"0.68rem", color:TC_DEEP, textTransform:"uppercase", letterSpacing:"0.16em", fontWeight:700 }}>
            Delivering in 25 km radius
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily:"var(--font-display)",
          fontSize:"clamp(2.4rem,5.5vw,3.8rem)",
          fontWeight:400, lineHeight:0.96, letterSpacing:"-0.035em",
          color:INK, marginBottom:14,
        }}>
          Good {greeting},<br />
          <span style={{
            fontStyle:"italic",
            background:`linear-gradient(135deg,${TC_SOFT} 0%,${TC} 50%,${TC_DEEP} 100%)`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>{user?.name?.split(" ")?.[0]||"friend"}</span>
        </h1>

        {/* Rotating catchy prompt */}
        <div style={{ minHeight:30, overflow:"hidden" }}>
          <p key={promptIdx} style={{
            fontSize:"1.02rem", color:INK_SOFT, lineHeight:1.5,
            animation:"slide-up 0.4s cubic-bezier(0.2,0.8,0.2,1) both",
          }}>
            {PROMPTS[promptIdx]}
          </p>
        </div>

        {/* Quick stats */}
        <div className="home-stats" style={{ marginTop:24, display:"flex", gap:28, flexWrap:"wrap" }}>
          {[
            { num:"25", suffix:"km", label:"Search radius", icon:"🎯" },
            { num:"30", suffix:"min", label:"Avg delivery", icon:"⚡" },
            { num:"4.8", suffix:"★", label:"Avg rating",   icon:"🌟" },
            { num:"100%", suffix:"",  label:"Fresh food",  icon:"🌿" },
          ].map((s,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, animation:`fade-up 0.5s ease-out ${0.2+i*0.1}s both` }}>
              <span style={{ fontSize:"1.2rem" }}>{s.icon}</span>
              <div>
                <div style={{
                  fontFamily:"var(--font-display)", fontSize:"1.2rem",
                  fontWeight:500, color:INK, lineHeight:1,
                }}>
                  {s.num}<span style={{ fontSize:"0.85rem", color:TC, fontFamily:"var(--font-sans)", fontWeight:700 }}>{s.suffix}</span>
                </div>
                <div style={{ fontSize:"0.7rem", color:INK_MUTED, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginTop:2 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 25KM LOCATION SELECTOR BAR ── */}
      <section style={{ marginBottom: 36, animation:"fade-up 0.5s ease-out both" }}>
        <div style={{
          background: CARD,
          border: `1.5px solid ${INK_HAIR}`,
          borderRadius: 22,
          padding: "18px 22px",
          boxShadow: "0 2px 14px rgba(28,18,8,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 14
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `linear-gradient(135deg, ${TC}18, ${TC}0A)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: TC, flexShrink: 0, border: `1px solid ${TC}22`
              }}>
                <MapPin size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.7rem", color: INK_MUTED, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
                    Active Delivery Area
                  </span>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                    background: `${PISTACHIO}18`, color: PISTACHIO, letterSpacing: "0.04em",
                    display: "inline-flex", alignItems: "center", gap: 4
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: PISTACHIO }} />
                    25 KM RANGE ACTIVE
                  </span>
                </div>
                <div style={{ fontSize: "1.08rem", fontWeight: 700, color: INK, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  {activeLoc.name}
                  {locLoading && <RefreshCw size={14} className="spin-icon" style={{ color: TC }} />}
                </div>
              </div>
            </div>

            <button
              onClick={handleUseGps}
              disabled={locLoading}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: `1.5px solid ${TC}`,
                background: TC,
                color: "#FFF5E6",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: locLoading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                boxShadow: `0 4px 12px ${TC}35`,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <Navigation size={13} />
              {locLoading ? "Locating..." : "Use My GPS"}
            </button>
          </div>

          {/* Quick preset chips & User Saved Addresses */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingTop: 10, borderTop: `1px solid ${INK_HAIR}` }}>
            <span style={{ fontSize: "0.72rem", color: INK_MUTED, fontWeight: 600 }}>Quick areas:</span>

            {/* User's saved addresses (Ahmedabad, Surat, Rajkot, etc.) */}
            {addresses.map((addr) => {
              const isSelected = activeLoc.addressId === addr.addressId || (selectedAddressId === addr.addressId && (!activeLoc.addressId || activeLoc.addressId === addr.addressId));
              const title = addr.city || addr.street || addr.label || "Saved Address";
              return (
                <button
                  key={addr.addressId}
                  onClick={() => handleSelectUserAddress(addr)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: `1.5px solid ${isSelected ? TC : INK_HAIR}`,
                    background: isSelected ? `${TC}14` : "#FFF",
                    color: isSelected ? TC_DEEP : INK_SOFT,
                    fontSize: "0.78rem",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: isSelected ? `0 2px 8px ${TC}20` : "none"
                  }}
                >
                  <MapPin size={11} color={isSelected ? TC : INK_MUTED} />
                  <span>{addr.label ? `${addr.label}: ` : ""}{title}</span>
                </button>
              );
            })}

            {/* Preset locations */}
            {PRESET_LOCATIONS.map((loc) => {
              const isSelected = !activeLoc.addressId && activeLoc.name === loc.name;
              return (
                <button
                  key={loc.name}
                  onClick={() => handleSelectLocation(loc)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: `1.5px solid ${isSelected ? TC : INK_HAIR}`,
                    background: isSelected ? `${TC}14` : "#FFF",
                    color: isSelected ? TC_DEEP : INK_SOFT,
                    fontSize: "0.78rem",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <MapPin size={11} color={isSelected ? TC : INK_MUTED} />
                  <span>{loc.name}</span>
                </button>
              );
            })}

            {/* Manage addresses link */}
            <button
              onClick={() => navigate("/addresses")}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: `1px dashed ${INK_HAIR}`,
                background: "transparent",
                color: TC,
                fontSize: "0.76rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <span>+ Manage Addresses</span>
            </button>
          </div>

          {/* GPS notice if outside range */}
          {gpsNotice && (
            <div style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: "0.82rem",
              color: "#92400E",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                <span>{gpsNotice}</span>
              </div>
              <button
                onClick={() => setGpsNotice("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#92400E", fontWeight: 700, padding: 4 }}
              >✕</button>
            </div>
          )}
        </div>
      </section>

      {/* ── CUISINE FILTER ── */}
      <section style={{ marginBottom:44 }}>
        <div style={{ fontSize:"0.7rem", color:INK_MUTED, textTransform:"uppercase", letterSpacing:"0.14em", fontWeight:700, marginBottom:14 }}>
          Browse by cuisine
        </div>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
          {CUISINES.map(c=>{
            const active=cuisine===c.label;
            return (
              <button key={c.label} onClick={()=>setCuisine(c.label)} style={{
                padding:"9px 18px", borderRadius:999, whiteSpace:"nowrap",
                border:`1.5px solid ${active?TC:INK_HAIR}`,
                background:active?TC:CARD,
                color:active?"#FFF5E6":INK_SOFT,
                fontFamily:"var(--font-sans)", fontSize:"0.85rem",
                fontWeight:active?600:500, cursor:"pointer",
                transition:"all 0.2s",
                boxShadow:active?`0 4px 14px ${TC}35`:"none",
                display:"flex", alignItems:"center", gap:6,
              }}>
                <span>{c.emoji}</span> {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── FEATURED ── */}
      {featured && (
        <section style={{ marginBottom:52 }}>
          <FeaturedCard restaurant={featured} onClick={()=>navigate(`/restaurants/${featured.restaurantId}`)} />
        </section>
      )}

      {/* ── OFFERS STRIP ── */}
      <OffersStrip />

      {/* ── LIVE REGISTERED FLEET (DATABASE RIDERS) ── */}
      <ActiveRidersFleet drivers={availableDrivers} />

      {/* ── POPULAR GRID (25km RANGE) ── */}
      <section style={{ marginTop:44 }}>
        <div style={{ marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <TrendingUp size={20} style={{ color:TC }} />
              <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.85rem", fontWeight:500, letterSpacing:"-0.02em", color:INK }}>
                Popular near you (25 km range)
              </h2>
            </div>
            <p style={{ fontSize:"0.82rem", color:INK_MUTED, marginTop:4, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={13} color={TC} />
              Showing all restaurants within 25 km of <strong>{activeLoc.name}</strong>
            </p>
          </div>
          {filtered.length>0&&(
            <span style={{ fontSize:"0.82rem", color:TC_DEEP, background:`${TC}15`, padding:"6px 16px", borderRadius:999, fontWeight:700 }}>
              {filtered.length} restaurant{filtered.length!==1?"s":""} within 25 km
            </span>
          )}
        </div>

        {loading&&filtered.length===0 ? <GridSkeleton /> :
         filtered.length===0           ? <EmptyState cuisine={cuisine} locationName={activeLoc.name} /> : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:24 }}>
            {filtered.map((r,i)=>(
              <RestaurantCard key={r.restaurantId} restaurant={r} index={i}
                onClick={()=>navigate(`/restaurants/${r.restaurantId}`)} />
            ))}
          </div>
        )}
      </section>

      <style>{`
        @keyframes fade-up   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slide-up  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulse-dot { 0%,100%{opacity:1;box-shadow:0 0 0 0 ${TC}99} 50%{opacity:.7;box-shadow:0 0 0 6px ${TC}00} }
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .home-stats { gap: 20px !important; }
          .featured-card { grid-template-columns: 1fr !important; }
          .featured-card > div:first-child { padding: 24px 20px !important; }
          .featured-card > div:last-child { height: 220px !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Offers strip ── */
function OffersStrip() {
  const offers = [
    { icon:"🎉", title:"50% OFF", sub:"First 3 orders", color:"#FEF3C7", accent:CURRY },
    { icon:"🚴", title:"Free Delivery", sub:"Within 25 km radius", color:"#ECFDF5", accent:PISTACHIO },
    { icon:"🎁", title:"₹100 Cashback", sub:"Add money to wallet", color:"#FEF2F2", accent:TC },
    { icon:"⚡", title:"Express 25min", sub:"Adalaj & Gandhinagar", color:"#EFF6FF", accent:"#2563EB" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14, marginBottom:0 }}>
      {offers.map((o,i)=>(
        <div key={i} style={{
          background:o.color, borderRadius:16, padding:"18px 20px",
          display:"flex", alignItems:"center", gap:14, cursor:"pointer",
          border:"1px solid rgba(0,0,0,0.05)",
          transition:"all 0.2s",
          animation:`fade-up 0.4s ease-out ${i*0.06}s both`,
        }}
          onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.08)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
        >
          <span style={{ fontSize:"1.8rem", animation:"float 3s ease-in-out infinite", display:"block" }}>{o.icon}</span>
          <div>
            <div style={{ fontWeight:800, fontSize:"0.95rem", color:o.accent }}>{o.title}</div>
            <div style={{ fontSize:"0.72rem", color:"rgba(0,0,0,0.5)", marginTop:2, fontWeight:500 }}>{o.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Registered Fleet / Active Riders ── */
function ActiveRidersFleet({ drivers = [] }) {
  if (!drivers || drivers.length === 0) return null;
  return (
    <section style={{ marginTop: 36, animation: "fade-up 0.5s ease-out both" }}>
      <div style={{
        background: CARD,
        border: `1.5px solid ${INK_HAIR}`,
        borderRadius: 22,
        padding: "20px 24px",
        boxShadow: "0 2px 14px rgba(28,18,8,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${PISTACHIO}18`, color: PISTACHIO,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Bike size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: INK_MUTED, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
                Live Delivery Fleet
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 500, color: INK, margin: 0 }}>
                Available Delivery Partners
              </h3>
            </div>
          </div>
          <span style={{
            fontSize: "0.72rem", fontWeight: 700, padding: "4px 12px", borderRadius: 999,
            background: `${PISTACHIO}16`, color: PISTACHIO, letterSpacing: "0.04em",
            display: "inline-flex", alignItems: "center", gap: 6
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: PISTACHIO, animation: "pulse-dot 2s infinite" }} />
            {drivers.length} Rider{drivers.length !== 1 ? "s" : ""} Available within 25 km
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {drivers.map((d) => (
            <div key={d.driverId || d.userId} style={{
              background: "#FFF",
              border: `1px solid ${INK_HAIR}`,
              borderRadius: 16,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 1px 4px rgba(28,18,8,0.03)"
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, ${TC}14, ${SAFFRON}20)`,
                color: TC_DEEP,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "1.1rem", fontFamily: "var(--font-display)"
              }}>
                {d.name ? d.name.charAt(0).toUpperCase() : "R"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.92rem", color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.name}
                  </span>
                  <ShieldCheck size={14} color={PISTACHIO} />
                </div>
                <div style={{ fontSize: "0.74rem", color: INK_SOFT, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{d.vehicleType || "BIKE"}</span>
                  <span>•</span>
                  {d.distanceKm != null ? (
                    <span style={{ color: TC_DEEP, fontWeight: 700 }}>{Number(d.distanceKm).toFixed(1)} km away</span>
                  ) : (
                    <span>{d.phone || "Verified"}</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{
                  fontSize: "0.66rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                  background: d.status === "OFFLINE" ? "rgba(0,0,0,0.06)" : `${PISTACHIO}18`,
                  color: d.status === "OFFLINE" ? INK_MUTED : PISTACHIO,
                  textTransform: "uppercase"
                }}>
                  {d.status || "ONLINE"}
                </span>
                <div style={{ fontSize: "0.68rem", color: CURRY, fontWeight: 700, marginTop: 3 }}>
                  ★ {d.avgRating > 0 ? Number(d.avgRating).toFixed(1) : "5.0"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Featured card ── */
function FeaturedCard({ restaurant:r, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const palette = paletteFor(r.name);

  const formattedDistance = useMemo(() => {
    if (r.distanceKm == null) return "Within 25 km";
    const d = Number(r.distanceKm);
    if (d < 0.1) return "Nearby (< 100m)";
    return `${d.toFixed(1)} km away`;
  }, [r.distanceKm]);

  return (
    <div onClick={onClick} className="featured-card" style={{
      display:"grid", gridTemplateColumns:"1.2fr 1fr",
      background:CARD, borderRadius:28,
      border:`1px solid ${INK_HAIR}`, overflow:"hidden", cursor:"pointer",
      boxShadow:`0 2px 4px ${INK_HAIR},0 28px 56px -20px rgba(28,18,8,0.14)`,
      transition:"all 0.35s cubic-bezier(0.2,0.8,0.2,1)",
    }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-5px)"; e.currentTarget.style.boxShadow=`0 2px 4px ${INK_HAIR},0 40px 72px -20px rgba(28,18,8,0.22)`; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=`0 2px 4px ${INK_HAIR},0 28px 56px -20px rgba(28,18,8,0.14)`; }}
    >
      {/* Left */}
      <div style={{ padding:"44px 48px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"5px 12px", borderRadius:999,
            background:`${TC}12`, color:TC_DEEP,
            fontSize:"0.66rem", fontWeight:700, letterSpacing:"0.12em",
            textTransform:"uppercase", marginBottom:20,
          }}>
            <Flame size={10} /> Editor's pick · {formattedDistance}
          </div>
          <h3 style={{
            fontFamily:"var(--font-display)", fontSize:"2.6rem",
            fontWeight:500, lineHeight:1.02, letterSpacing:"-0.025em",
            color:INK, marginBottom:12,
          }}>{r.name}</h3>
          <p style={{ fontSize:"0.94rem", color:INK_SOFT, lineHeight:1.6, marginBottom:26, maxWidth:380 }}>
            {r.description||`Authentic ${r.cuisineType} flavors crafted with care and love.`}
          </p>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:32 }}>
            <HeroMetric icon={Star}   value={r.avgRating>0?Number(r.avgRating).toFixed(1):"New"} label="Rating"   color={CURRY}     filled />
            <HeroMetric icon={Clock}  value={`${r.avgDeliveryTimeMins||30}`} suffix="min"         label="Delivery"  color={SAFFRON} />
            <HeroMetric icon={MapPin} value={formattedDistance}                                   label="Distance"  color={TC} />
          </div>
        </div>
        <button style={{
          alignSelf:"flex-start", padding:"13px 28px", borderRadius:14, border:"none",
          background:`linear-gradient(135deg,${TC_SOFT},${TC} 55%,${TC_DEEP})`,
          color:"#FFF5E6", fontSize:"0.92rem", fontWeight:600,
          fontFamily:"var(--font-sans)", cursor:"pointer",
          display:"flex", alignItems:"center", gap:8,
          boxShadow:`0 8px 22px ${TC}45`,
          transition:"all 0.2s",
        }}>
          View menu <span style={{ fontSize:"1.1rem" }}>→</span>
        </button>
      </div>

      {/* Right – image */}
      <div style={{
        position:"relative", minHeight:360,
        background:`linear-gradient(135deg,${palette.bg} 0%,${palette.accent}30 100%)`,
        overflow:"hidden",
      }}>
        {r.imageUrl&&!imgError&&(
          <img src={r.imageUrl} alt={r.name}
            onLoad={()=>setImgLoaded(true)} onError={()=>setImgError(true)}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%",
              objectFit:"cover", opacity:imgLoaded?1:0, transition:"opacity 0.5s" }}
          />
        )}
        {(!r.imageUrl||imgError)&&(
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontFamily:"var(--font-display)", fontSize:"14rem", fontWeight:500,
              color:palette.accent, lineHeight:0.8, fontStyle:"italic", opacity:0.8 }}>
              {r.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
        {r.imageUrl&&!imgError&&(
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(28,18,8,0.55) 100%)" }} />
        )}
        <div style={{
          position:"absolute", bottom:22, left:22,
          fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.18em",
          textTransform:"uppercase",
          color: r.imageUrl&&!imgError?"#FFF5E6":palette.accent, opacity:0.9,
        }}>— Featured in 25km range</div>
      </div>
    </div>
  );
}

function HeroMetric({ icon:Icon, value, suffix, label, color, filled, textOnly }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:34, height:34, borderRadius:10, background:`${color}16`,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {Icon ? <Icon size={15} style={{ color }} fill={filled?color:"none"} />
               : <span style={{ width:7, height:7, borderRadius:"50%", background:color }} />}
      </div>
      <div>
        <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
          <span style={{
            fontFamily:textOnly?"var(--font-sans)":"var(--font-display)",
            fontSize:textOnly?"0.95rem":"1.15rem",
            fontWeight:textOnly?600:500, color:INK, lineHeight:1,
          }}>{value}</span>
          {suffix&&<span style={{ fontSize:"0.74rem", color, fontWeight:700 }}>{suffix}</span>}
        </div>
        <div style={{ fontSize:"0.66rem", color:INK_MUTED, marginTop:3, letterSpacing:"0.04em", fontWeight:600, textTransform:"uppercase" }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Restaurant card ── */
function RestaurantCard({ restaurant:r, index, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const palette = paletteFor(r.name);

  const formattedDistance = useMemo(() => {
    if (r.distanceKm == null) return "Within 25 km";
    const d = Number(r.distanceKm);
    if (d < 0.1) return "Nearby (< 100m)";
    return `${d.toFixed(1)} km away`;
  }, [r.distanceKm]);

  return (
    <div onClick={onClick} style={{
      background:CARD, borderRadius:20, border:`1px solid ${INK_HAIR}`,
      overflow:"hidden", cursor:"pointer",
      transition:"all 0.28s cubic-bezier(0.2,0.8,0.2,1)",
      animation:`fade-up 0.4s ease-out ${index*0.05}s both`,
      boxShadow:`0 1px 3px ${INK_HAIR}`,
      display: "flex", flexDirection: "column"
    }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-5px)"; e.currentTarget.style.boxShadow=`0 2px 4px ${INK_HAIR},0 22px 44px -12px rgba(28,18,8,0.16)`; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=`0 1px 3px ${INK_HAIR}`; }}
    >
      {/* Image */}
      <div style={{ height:190, position:"relative",
        background:`linear-gradient(135deg,${palette.bg} 0%,${palette.accent}28 100%)`,
        overflow:"hidden" }}>
        {r.imageUrl&&!imgError?(
          <>
            {!imgLoaded&&<div style={{ position:"absolute", inset:0,
              background:`linear-gradient(90deg,${palette.bg} 0%,${palette.accent}20 50%,${palette.bg} 100%)`,
              backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />}
            <img src={r.imageUrl} alt={r.name}
              onLoad={()=>setImgLoaded(true)} onError={()=>setImgError(true)}
              style={{ position:"absolute", inset:0, width:"100%", height:"100%",
                objectFit:"cover", opacity:imgLoaded?1:0, transition:"opacity 0.4s" }}
            />
          </>
        ):(
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontFamily:"var(--font-display)", fontSize:"6.5rem", fontWeight:500,
              color:palette.accent, fontStyle:"italic", opacity:0.82 }}>
              {r.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Distance Badge (Top-Left) */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          padding: "4px 10px", borderRadius: 999,
          background: "rgba(28,18,8,0.86)", color: "#FFF5E6",
          fontSize: "0.74rem", fontWeight: 700,
          display: "flex", alignItems: "center", gap: 5,
          boxShadow: "0 2px 8px rgba(0,0,0,0.22)",
          backdropFilter: "blur(6px)"
        }}>
          <MapPin size={11} color={TC_SOFT} /> {formattedDistance}
        </div>

        {/* Closed overlay */}
        {r.isOpen===false&&(
          <div style={{ position:"absolute", inset:0, background:"rgba(28,18,8,0.62)",
            backdropFilter:"blur(3px)", display:"flex", alignItems:"center", justifyContent:"center",
            color:"#FFF5E6", fontSize:"0.82rem", fontWeight:700,
            letterSpacing:"0.06em", textTransform:"uppercase" }}>Currently closed</div>
        )}
        {/* Rating */}
        {r.avgRating>0&&(
          <div style={{ position:"absolute", top:12, right:12,
            padding:"4px 10px", borderRadius:999,
            background:"rgba(255,249,238,0.95)", color:INK,
            fontSize:"0.76rem", fontWeight:700,
            display:"flex", alignItems:"center", gap:4,
            boxShadow:"0 2px 8px rgba(28,18,8,0.18)",
            backdropFilter:"blur(8px)" }}>
            <Star size={10} fill={CURRY} color={CURRY} /> {Number(r.avgRating).toFixed(1)}
          </div>
        )}
        {/* Delivery time overlay */}
        <div style={{ position:"absolute", bottom:12, left:12,
          padding:"4px 10px", borderRadius:999,
          background:"rgba(255,249,238,0.92)",
          backdropFilter:"blur(8px)",
          fontSize:"0.72rem", fontWeight:600, color:INK_SOFT,
          display:"flex", alignItems:"center", gap:4 }}>
          <Clock size={10} /> {r.avgDeliveryTimeMins||30} min
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"16px 20px 20px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize:"1.05rem", fontWeight:700, color:INK, marginBottom:3,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</h3>
          <p style={{ fontSize:"0.8rem", color:INK_MUTED, marginBottom:14,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {r.cuisineType} · {r.address || "Adalaj"}
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:0,
          paddingTop:12, borderTop:`1px solid ${INK_HAIR}`,
          fontSize:"0.76rem", color:INK_SOFT }}>
          {r.minOrderAmount>0&&<span style={{ color:INK_MUTED }}>Min ₹{r.minOrderAmount}</span>}
          {r.totalReviews>0&&(
            <span style={{ marginLeft: r.minOrderAmount>0 ? 10 : 0, color:INK_MUTED, fontSize:"0.7rem" }}>
              ({r.totalReviews} reviews)
            </span>
          )}
          {/* Veg/nonveg tag */}
          {r.isPureVeg&&(
            <span style={{
              marginLeft:"auto", display:"flex", alignItems:"center", gap:4,
              fontSize:"0.68rem", color:PISTACHIO, fontWeight:700,
              textTransform:"uppercase", letterSpacing:"0.04em",
            }}>
              <span style={{ width:8, height:8, border:`1.5px solid ${PISTACHIO}`,
                borderRadius:2, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ width:4, height:4, borderRadius:"50%", background:PISTACHIO }} />
              </span>
              Pure Veg
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:24 }}>
      {[...Array(6)].map((_,i)=>(
        <div key={i} style={{ background:CARD, borderRadius:20, border:`1px solid ${INK_HAIR}`, overflow:"hidden" }}>
          <div style={{ height:190,
            background:`linear-gradient(90deg,${FIELD} 0%,${INK_HAIR} 50%,${FIELD} 100%)`,
            backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
          <div style={{ padding:20 }}>
            <div style={{ height:15, width:"65%", background:FIELD, borderRadius:4, marginBottom:8 }} />
            <div style={{ height:11, width:"42%", background:FIELD, borderRadius:4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ cuisine, locationName }) {
  return (
    <div style={{ padding:"72px 24px", textAlign:"center",
      background:CARD, borderRadius:20, border:`1.5px dashed ${INK_HAIR}` }}>
      <ChefHat size={40} style={{ color:INK_MUTED, margin:"0 auto 16px", display:"block" }} />
      <h3 style={{ fontSize:"1.05rem", fontWeight:600, marginBottom:6, color:INK }}>
        No {cuisine==="All"?"restaurants":`${cuisine} spots`} within 25 km of {locationName}
      </h3>
      <p style={{ fontSize:"0.88rem", color:INK_SOFT, maxWidth:380, margin:"0 auto" }}>
        Try selecting a nearby area like Annapurnadham or Adalaj from the location bar above.
      </p>
    </div>
  );
}
