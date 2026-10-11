import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock, TrendingUp, Flame, ChefHat, Zap, Sparkles } from "lucide-react";
import { useRestaurantStore } from "../../store/restaurantStore";
import { useAuthStore } from "../../store/authStore";

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

const PROMPTS = [
  "Craving something spicy tonight? 🌶",
  "Biryani o'clock — are we doing this?",
  "Your stomach called. It wants butter chicken.",
  "Late-night munchies? We've got you. 🌙",
  "Life's too short for boring food.",
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
  const { topRated, nearby, loading, fetchTopRated, fetchNearby } = useRestaurantStore();
  const [cuisine, setCuisine]     = useState("All");
  const [promptIdx, setPromptIdx] = useState(0);

  useEffect(()=>{ fetchTopRated(); fetchNearby(); },[]);

  // Rotate catchy prompt every 3s
  useEffect(()=>{
    const t = setInterval(()=>setPromptIdx(i=>(i+1)%PROMPTS.length), 3200);
    return ()=>clearInterval(t);
  },[]);

  const all = useMemo(()=>{
    const m=new Map();
    [...topRated,...nearby].forEach(r=>m.set(r.restaurantId,r));
    return Array.from(m.values());
  },[topRated,nearby]);

  const featured   = topRated[0];
  const others     = useMemo(()=>all.filter(r=>r.restaurantId!==featured?.restaurantId),[all,featured]);
  const filtered   = useMemo(()=>cuisine==="All"?others:others.filter(r=>r.cuisineType===cuisine),[others,cuisine]);

  const hour=new Date().getHours();
  const greeting=hour<12?"morning":hour<17?"afternoon":"evening";

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
      <section style={{ marginBottom:52, animation:"fade-up 0.6s cubic-bezier(0.2,0.8,0.2,1) both" }}>
        {/* Live pill */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          padding:"5px 14px", borderRadius:999,
          background:`${TC}0D`, border:`1px solid ${TC}22`,
          marginBottom:22,
        }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:TC, animation:"pulse-dot 2s ease-in-out infinite" }} />
          <span style={{ fontSize:"0.68rem", color:TC_DEEP, textTransform:"uppercase", letterSpacing:"0.16em", fontWeight:700 }}>
            Delivering to your area
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily:"var(--font-display)",
          fontSize:"clamp(2.6rem,5.5vw,4rem)",
          fontWeight:400, lineHeight:0.96, letterSpacing:"-0.035em",
          color:INK, marginBottom:16,
        }}>
          Good {greeting},<br />
          <span style={{
            fontStyle:"italic",
            background:`linear-gradient(135deg,${TC_SOFT} 0%,${TC} 50%,${TC_DEEP} 100%)`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>{user?.name?.split(" ")?.[0]||"friend"}</span>
        </h1>

        {/* Rotating catchy prompt */}
        <div style={{ minHeight:32, overflow:"hidden" }}>
          <p key={promptIdx} style={{
            fontSize:"1.05rem", color:INK_SOFT, lineHeight:1.5,
            animation:"slide-up 0.4s cubic-bezier(0.2,0.8,0.2,1) both",
          }}>
            {PROMPTS[promptIdx]}
          </p>
        </div>

        {/* Quick stats */}
        <div className="home-stats" style={{ marginTop:28, display:"flex", gap:28, flexWrap:"wrap" }}>
          {[
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

      {/* ── CUISINE FILTER ── */}
      <section style={{ marginBottom:48 }}>
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
        <section style={{ marginBottom:56 }}>
          <FeaturedCard restaurant={featured} onClick={()=>navigate(`/restaurants/${featured.restaurantId}`)} />
        </section>
      )}

      {/* ── OFFERS STRIP ── */}
      <OffersStrip />

      {/* ── POPULAR GRID ── */}
      <section style={{ marginTop:52 }}>
        <div style={{ marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <TrendingUp size={18} style={{ color:TC }} />
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.8rem", fontWeight:500, letterSpacing:"-0.02em", color:INK }}>
              Popular near you
            </h2>
          </div>
          {filtered.length>0&&(
            <span style={{ fontSize:"0.8rem", color:INK_MUTED, fontWeight:500 }}>
              {filtered.length} restaurant{filtered.length!==1?"s":""}
            </span>
          )}
        </div>

        {loading&&filtered.length===0 ? <GridSkeleton /> :
         filtered.length===0           ? <EmptyState cuisine={cuisine} /> : (
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
    { icon:"🚴", title:"Free Delivery", sub:"On orders above ₹299", color:"#ECFDF5", accent:PISTACHIO },
    { icon:"🎁", title:"₹100 Cashback", sub:"Add money to wallet", color:"#FEF2F2", accent:TC },
    { icon:"⚡", title:"Express 20min", sub:"Select restaurants", color:"#EFF6FF", accent:"#2563EB" },
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

/* ── Featured card ── */
function FeaturedCard({ restaurant:r, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const palette = paletteFor(r.name);

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
            <Flame size={10} /> Editor's pick
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
            <HeroMetric icon={Star}  value={r.avgRating>0?Number(r.avgRating).toFixed(1):"New"} label="Rating"   color={CURRY}     filled />
            <HeroMetric icon={Clock} value={`${r.avgDeliveryTimeMins||30}`} suffix="min"         label="Delivery"  color={SAFFRON} />
            <HeroMetric              value={r.cuisineType}                                        label="Cuisine"   color={PISTACHIO} textOnly />
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
        }}>— Featured this week</div>
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

  return (
    <div onClick={onClick} style={{
      background:CARD, borderRadius:20, border:`1px solid ${INK_HAIR}`,
      overflow:"hidden", cursor:"pointer",
      transition:"all 0.28s cubic-bezier(0.2,0.8,0.2,1)",
      animation:`fade-up 0.4s ease-out ${index*0.05}s both`,
      boxShadow:`0 1px 3px ${INK_HAIR}`,
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
      <div style={{ padding:"16px 20px 20px" }}>
        <h3 style={{ fontSize:"1.05rem", fontWeight:700, color:INK, marginBottom:3,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</h3>
        <p style={{ fontSize:"0.8rem", color:INK_MUTED, marginBottom:14,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {r.cuisineType} · {r.address?.split(",")?.[0]||"Nearby"}
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:0,
          paddingTop:12, borderTop:`1px solid ${INK_HAIR}`,
          fontSize:"0.76rem", color:INK_SOFT }}>
          {r.minOrderAmount>0&&<span style={{ color:INK_MUTED }}>Min ₹{r.minOrderAmount}</span>}
          {r.totalReviews>0&&(
            <span style={{ marginLeft:"auto", color:INK_MUTED, fontSize:"0.7rem" }}>
              {r.totalReviews} reviews
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

function EmptyState({ cuisine }) {
  return (
    <div style={{ padding:"72px 24px", textAlign:"center",
      background:CARD, borderRadius:20, border:`1.5px dashed ${INK_HAIR}` }}>
      <ChefHat size={40} style={{ color:INK_MUTED, margin:"0 auto 16px", display:"block" }} />
      <h3 style={{ fontSize:"1.05rem", fontWeight:600, marginBottom:6, color:INK }}>
        No {cuisine==="All"?"restaurants":`${cuisine} spots`} nearby yet
      </h3>
      <p style={{ fontSize:"0.88rem", color:INK_SOFT, maxWidth:340, margin:"0 auto" }}>
        Try a different cuisine or check back soon.
      </p>
    </div>
  );
}
