import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import toast from "react-hot-toast";
import {
  Navigation, MapPin, Package, CheckCircle, Clock, DollarSign,
  ToggleLeft, ToggleRight, Loader2, RefreshCw, AlertCircle,
  Truck, Star, Phone, User, ArrowRight, History, Wifi, WifiOff
} from "lucide-react";
import { useDriverStore } from "../store/driverStore";
import { useAuthStore } from "../store/authStore";

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ─── Design tokens ────────────────────────────────────────────────────────
const INK        = "#1C1208";
const INK_SOFT   = "rgba(28,18,8,0.58)";
const INK_MUTED  = "rgba(28,18,8,0.38)";
const INK_HAIR   = "rgba(28,18,8,0.07)";
const CARD       = "#FFF9EE";
const FIELD      = "#F5ECD8";
const TC         = "#C0401E";
const TC_SOFT    = "#DE6A40";
const SUCCESS    = "#15803D";
const SAFFRON    = "#D4882A";
const PISTACHIO  = "#5A7040";

const DELIVERY_STATUS = {
  PENDING:         { label: "Pending",       color: "#6D28D9", bg: "#F5F3FF" },
  DRIVER_ASSIGNED: { label: "Assigned",      color: SAFFRON,   bg: "#FFFBEB" },
  PICKED_UP:       { label: "Picked Up",     color: TC,        bg: `${TC}12` },
  IN_TRANSIT:      { label: "In Transit",    color: TC_SOFT,   bg: `${TC_SOFT}12` },
  DELIVERED:       { label: "Delivered",     color: SUCCESS,   bg: "#ECFDF5" },
  CANCELLED:       { label: "Cancelled",    color: "#DC2626", bg: "#FEF2F2" },
  FAILED:          { label: "Failed",        color: "#DC2626", bg: "#FEF2F2" },
};

function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom(), { animate: true, duration: 1 });
  }, [center]);
  return null;
}

const driverMapIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='18' fill='%2315803D' stroke='white' stroke-width='2'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='18'%3E🛵%3C/text%3E%3C/svg%3E",
  iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40],
});

const pickupIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='18' fill='%23C0401E' stroke='white' stroke-width='2'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='18'%3E🍽%3C/text%3E%3C/svg%3E",
  iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40],
});

const deliverIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='18' fill='%23D4882A' stroke='white' stroke-width='2'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='18'%3E🏠%3C/text%3E%3C/svg%3E",
  iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40],
});

export default function DriverDashboard() {
  const { user } = useAuthStore();
  const {
    driverProfile, activeDelivery, deliveryHistory, isOnline, currentLocation,
    fetchProfile, goOnline, goOffline, startLocationTracking, stopLocationTracking,
    fetchActiveDelivery, fetchDeliveryHistory, confirmPickup, completeDelivery,
  } = useDriverStore();

  const [tab, setTab] = useState("live");
  const [toggling, setToggling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]);

  // Bootstrap
  useEffect(() => {
    fetchProfile().catch(() => {});
    fetchActiveDelivery().catch(() => {});
    fetchDeliveryHistory().catch(() => {});
  }, []);

  // Update map center when location changes
  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.latitude, currentLocation.longitude]);
    }
  }, [currentLocation]);

  // Poll active delivery every 20s
  useEffect(() => {
    const t = setInterval(() => fetchActiveDelivery().catch(() => {}), 20000);
    return () => clearInterval(t);
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    try {
      if (isOnline) {
        await goOffline();
        stopLocationTracking();
        toast.success("You're offline. Rest well! 😴");
      } else {
        // Get current location first
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
        ).catch(() => ({ coords: { latitude: 28.6139, longitude: 77.209 } }));

        const { latitude, longitude } = pos.coords;
        await goOnline(latitude, longitude);
        startLocationTracking();
        setMapCenter([latitude, longitude]);
        toast.success("You're online! Ready for deliveries 🚀");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
    setToggling(false);
  };

  const handlePickup = async () => {
    setActionLoading(true);
    try {
      await confirmPickup();
      toast.success("Pickup confirmed! Heading to customer 🏠");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to confirm pickup");
    }
    setActionLoading(false);
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await completeDelivery();
      await fetchDeliveryHistory();
      toast.success("Delivery completed! Great job 🎉");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to complete delivery");
    }
    setActionLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchActiveDelivery(), fetchDeliveryHistory()]);
    setRefreshing(false);
  };

  // Not registered as driver
  if (!driverProfile) {
    return <DriverRegistrationView onSuccess={async () => { await fetchProfile(); }} />;
  }

  const earnings = Array.isArray(deliveryHistory)
    ? deliveryHistory
        .filter((d) => d.status === "DELIVERED" || d.deliveryStatus === "DELIVERED")
        .reduce((sum, d) => sum + parseFloat(d.deliveryFee || d.earnings || 0), 0)
    : 0;

  const deliveryCount = Array.isArray(deliveryHistory)
    ? deliveryHistory.filter((d) => d.status === "DELIVERED" || d.deliveryStatus === "DELIVERED").length
    : 0;

  return (
    <div style={{ paddingBottom: 80, animation: "fade-up 0.4s ease-out" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: isOnline ? SUCCESS : "#94A3B8",
              boxShadow: isOnline ? `0 0 0 3px ${SUCCESS}30` : "none",
              animation: isOnline ? "pulse-dot 2s ease-in-out infinite" : "none",
            }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.12em", color: isOnline ? SUCCESS : INK_MUTED }}>
              {isOnline ? "Online · Available" : "Offline"}
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,4vw,2.6rem)",
            fontWeight: 500, letterSpacing: "-0.03em", color: INK, lineHeight: 1 }}>
            Hey, {user?.name?.split(" ")[0] || "Driver"} 👋
          </h1>
          <p style={{ fontSize: "0.88rem", color: INK_SOFT, marginTop: 6 }}>
            {driverProfile.vehicleType} · {driverProfile.vehicleNumber || "Vehicle not set"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleRefresh} disabled={refreshing} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10,
            border: `1.5px solid ${INK_HAIR}`, background: CARD, cursor: "pointer",
            fontSize: "0.8rem", fontWeight: 600, color: INK_SOFT,
          }}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          </button>

          {/* Go Online/Offline toggle */}
          <button onClick={handleToggle} disabled={toggling} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
            border: "none", cursor: toggling ? "not-allowed" : "pointer",
            fontFamily: "var(--font-sans)", fontSize: "0.88rem", fontWeight: 700,
            background: isOnline
              ? "linear-gradient(135deg,#16A34A,#15803D)"
              : `linear-gradient(135deg,${TC_SOFT},${TC})`,
            color: "#FFF5E6",
            boxShadow: isOnline ? "0 4px 14px rgba(21,128,61,0.4)" : `0 4px 14px ${TC}45`,
            opacity: toggling ? 0.7 : 1, transition: "all 0.2s",
          }}>
            {toggling
              ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
              : isOnline ? <WifiOff size={15} /> : <Wifi size={15} />}
            {isOnline ? "Go Offline" : "Go Online"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Today's Earnings", value: `₹${earnings.toFixed(0)}`, icon: DollarSign, color: SAFFRON },
          { label: "Deliveries Done", value: deliveryCount, icon: CheckCircle, color: SUCCESS },
          { label: "Active Delivery", value: activeDelivery ? "1" : "0", icon: Truck, color: TC },
          { label: "Status", value: isOnline ? "Online" : "Offline", icon: isOnline ? Wifi : WifiOff, color: isOnline ? SUCCESS : INK_MUTED },
        ].map((s, i) => (
          <div key={i} style={{
            background: CARD, borderRadius: 16, padding: "18px 20px",
            border: `1px solid ${INK_HAIR}`, animation: `fade-up 0.4s ease-out ${i * 0.06}s both`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: INK_MUTED }}>{s.label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${s.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={13} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 500, color: INK }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 2, borderBottom: `2px solid ${INK_HAIR}`, marginBottom: 28 }}>
        {[
          { id: "live", label: "Live Map", icon: Navigation },
          { id: "delivery", label: "Active Delivery", icon: Package, badge: activeDelivery ? 1 : 0 },
          { id: "history", label: "History", icon: History },
        ].map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 16px",
            border: "none", background: "none", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: "0.85rem", fontWeight: 600,
            color: tab === id ? TC : INK_MUTED,
            borderBottom: `2px solid ${tab === id ? TC : "transparent"}`, marginBottom: -2,
            transition: "all 0.15s",
          }}>
            <Icon size={14} /> {label}
            {badge > 0 && (
              <span style={{ width: 16, height: 16, borderRadius: 999, background: TC,
                color: "#FFF5E6", fontSize: "0.6rem", fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === "live" && (
        <div style={{ animation: "fade-up 0.3s ease-out" }}>
          <LiveMapPanel
            isOnline={isOnline}
            currentLocation={currentLocation}
            mapCenter={mapCenter}
            activeDelivery={activeDelivery}
          />
        </div>
      )}

      {tab === "delivery" && (
        <div style={{ animation: "fade-up 0.3s ease-out" }}>
          <ActiveDeliveryPanel
            delivery={activeDelivery}
            isOnline={isOnline}
            actionLoading={actionLoading}
            onPickup={handlePickup}
            onComplete={handleComplete}
          />
        </div>
      )}

      {tab === "history" && (
        <div style={{ animation: "fade-up 0.3s ease-out" }}>
          <HistoryPanel deliveries={deliveryHistory} />
        </div>
      )}

      <style>{`
        @keyframes fade-up   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100%{opacity:1;box-shadow:0 0 0 0 ${SUCCESS}99} 50%{opacity:.7;box-shadow:0 0 0 6px ${SUCCESS}00} }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE MAP PANEL
// ═══════════════════════════════════════════════════════════════════════════
function LiveMapPanel({ isOnline, currentLocation, mapCenter, activeDelivery }) {
  const center = mapCenter || [28.6139, 77.209];

  return (
    <div>
      {!isOnline && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
          background: FIELD, borderRadius: 12, marginBottom: 16, border: `1px solid ${INK_HAIR}`,
        }}>
          <AlertCircle size={18} style={{ color: SAFFRON, flexShrink: 0 }} />
          <p style={{ fontSize: "0.88rem", color: INK_SOFT, lineHeight: 1.4 }}>
            Go online to start tracking your location and receive delivery assignments.
          </p>
        </div>
      )}

      <div style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${INK_HAIR}`,
        height: 420, boxShadow: `0 4px 20px rgba(28,18,8,0.08)` }}>
        <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapFlyTo center={center} />
          {currentLocation && (
            <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={driverMapIcon}>
              <Popup>📍 You are here</Popup>
            </Marker>
          )}
          {activeDelivery?.pickupLatitude && (
            <Marker position={[activeDelivery.pickupLatitude, activeDelivery.pickupLongitude]} icon={pickupIcon}>
              <Popup>🍽 Pickup: {activeDelivery.restaurantName || "Restaurant"}</Popup>
            </Marker>
          )}
          {activeDelivery?.deliveryLatitude && (
            <Marker position={[activeDelivery.deliveryLatitude, activeDelivery.deliveryLongitude]} icon={deliverIcon}>
              <Popup>🏠 Deliver to customer</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {currentLocation && (
        <div style={{ marginTop: 12, padding: "12px 16px", background: CARD, borderRadius: 12,
          border: `1px solid ${INK_HAIR}`, display: "flex", alignItems: "center", gap: 8 }}>
          <Navigation size={14} style={{ color: SUCCESS }} />
          <span style={{ fontSize: "0.8rem", color: INK_SOFT }}>
            Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </span>
          <span style={{ marginLeft: "auto", fontSize: "0.72rem", fontWeight: 700,
            color: SUCCESS, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVE DELIVERY PANEL
// ═══════════════════════════════════════════════════════════════════════════
function ActiveDeliveryPanel({ delivery, isOnline, actionLoading, onPickup, onComplete }) {
  if (!delivery) {
    return (
      <div style={{ padding: "72px 24px", textAlign: "center",
        background: CARD, borderRadius: 20, border: `1.5px dashed ${INK_HAIR}` }}>
        <Truck size={40} style={{ color: INK_MUTED, margin: "0 auto 16px", display: "block" }} />
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: INK, marginBottom: 8 }}>
          {isOnline ? "Waiting for a delivery..." : "Go online to receive deliveries"}
        </h3>
        <p style={{ fontSize: "0.85rem", color: INK_SOFT }}>
          {isOnline
            ? "You'll be assigned a delivery automatically when one is nearby."
            : "Toggle the Online switch at the top to start accepting orders."}
        </p>
      </div>
    );
  }

  const status     = delivery.deliveryStatus || delivery.status || "DRIVER_ASSIGNED";
  const statusMeta = DELIVERY_STATUS[status] || DELIVERY_STATUS.DRIVER_ASSIGNED;
  const isPickedUp = status === "PICKED_UP";

  return (
    <div style={{ animation: "fade-up 0.3s ease-out" }}>
      {/* Active delivery card */}
      <div style={{
        background: CARD, borderRadius: 20, padding: "24px",
        border: `2px solid ${TC}30`, marginBottom: 16,
        boxShadow: `0 4px 20px ${TC}15`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 500, color: INK }}>
              Active Delivery
            </h2>
            <p style={{ fontSize: "0.78rem", color: INK_MUTED, marginTop: 3 }}>
              Order #{(delivery.orderId || delivery.deliveryId || "").slice(-6).toUpperCase()}
            </p>
          </div>
          <span style={{ padding: "6px 16px", borderRadius: 999, background: statusMeta.bg,
            color: statusMeta.color, fontSize: "0.78rem", fontWeight: 700 }}>
            {statusMeta.label}
          </span>
        </div>

        {/* Route info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RouteStop
            icon="🍽"
            label="Pick up from"
            name={delivery.restaurantName || "Restaurant"}
            address={delivery.pickupAddress || "Restaurant address"}
            color={TC}
            isFirst
          />
          <div style={{ width: 1, height: 24, background: INK_HAIR, marginLeft: 20 }} />
          <RouteStop
            icon="🏠"
            label="Deliver to"
            name={delivery.customerName || "Customer"}
            address={delivery.dropoffAddress || delivery.deliveryAddress || delivery.deliverAddress || "Customer address"}
            color={SAFFRON}
          />
        </div>

        {/* Earnings */}
        {(delivery.deliveryFee || delivery.earnings) && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: `${SUCCESS}08`,
            borderRadius: 12, border: `1px solid ${SUCCESS}20`,
            display: "flex", alignItems: "center", gap: 10 }}>
            <DollarSign size={16} style={{ color: SUCCESS }} />
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: SUCCESS }}>
              Earnings: ₹{parseFloat(delivery.deliveryFee || delivery.earnings || 0).toFixed(0)}
            </span>
            {delivery.estimatedDeliveryMins && (
              <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: INK_MUTED }}>
                ~{delivery.estimatedDeliveryMins} mins
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          {!isPickedUp ? (
            <button onClick={onPickup} disabled={actionLoading} style={{
              flex: 1, padding: "13px", borderRadius: 12, border: "none",
              background: `linear-gradient(135deg,${TC_SOFT},${TC})`, color: "#FFF5E6",
              fontWeight: 700, fontSize: "0.9rem", cursor: actionLoading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, boxShadow: `0 4px 14px ${TC}35`,
              opacity: actionLoading ? 0.7 : 1,
            }}>
              {actionLoading
                ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                : <Package size={16} />}
              Confirm Pickup
            </button>
          ) : (
            <button onClick={onComplete} disabled={actionLoading} style={{
              flex: 1, padding: "13px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg,#16A34A,#15803D)", color: "#FFF5E6",
              fontWeight: 700, fontSize: "0.9rem", cursor: actionLoading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(21,128,61,0.4)",
              opacity: actionLoading ? 0.7 : 1,
            }}>
              {actionLoading
                ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                : <CheckCircle size={16} />}
              Complete Delivery
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RouteStop({ icon, label, name, address, color, isFirst }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${color}12`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.2rem" }}>
        {icon}
      </div>
      <div style={{ paddingBottom: 4 }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: INK }}>{name}</div>
        <div style={{ fontSize: "0.78rem", color: INK_SOFT, marginTop: 2 }}>{address}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY PANEL
// ═══════════════════════════════════════════════════════════════════════════
function HistoryPanel({ deliveries }) {
  const list = Array.isArray(deliveries) ? deliveries : [];

  if (list.length === 0) {
    return (
      <div style={{ padding: "72px 24px", textAlign: "center",
        background: CARD, borderRadius: 20, border: `1.5px dashed ${INK_HAIR}` }}>
        <History size={40} style={{ color: INK_MUTED, margin: "0 auto 16px", display: "block" }} />
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: INK, marginBottom: 6 }}>No deliveries yet</h3>
        <p style={{ fontSize: "0.85rem", color: INK_SOFT }}>Your completed deliveries will appear here.</p>
      </div>
    );
  }

  const completed  = list.filter((d) => d.status === "DELIVERED" || d.deliveryStatus === "DELIVERED");
  const totalEarnings = completed.reduce((sum, d) => sum + parseFloat(d.deliveryFee || d.earnings || 0), 0);

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, background: CARD, borderRadius: 14, padding: "16px 20px", border: `1px solid ${INK_HAIR}` }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 6 }}>
            Total Deliveries
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: INK }}>{completed.length}</div>
        </div>
        <div style={{ flex: 1, background: CARD, borderRadius: 14, padding: "16px 20px", border: `1px solid ${INK_HAIR}` }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 6 }}>
            Total Earned
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: SAFFRON }}>₹{totalEarnings.toFixed(0)}</div>
        </div>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.slice(0, 20).map((d, i) => {
          const status = d.deliveryStatus || d.status || "DELIVERED";
          const meta   = DELIVERY_STATUS[status] || DELIVERY_STATUS.DELIVERED;
          return (
            <div key={d.deliveryId || i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: CARD, borderRadius: 14, padding: "14px 18px", border: `1px solid ${INK_HAIR}`,
              animation: `fade-up 0.3s ease-out ${i * 0.03}s both`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${meta.color}12`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                  🛵
                </div>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: INK }}>
                    Order #{(d.orderId || d.deliveryId || "").slice(-6).toUpperCase()}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: INK_MUTED, marginTop: 2 }}>
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN") : "—"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {(d.deliveryFee || d.earnings) && (
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: SAFFRON }}>
                    ₹{parseFloat(d.deliveryFee || d.earnings || 0).toFixed(0)}
                  </span>
                )}
                <span style={{ padding: "4px 12px", borderRadius: 999, background: meta.bg,
                  color: meta.color, fontSize: "0.7rem", fontWeight: 700 }}>
                  {meta.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DRIVER REGISTRATION VIEW
// ═══════════════════════════════════════════════════════════════════════════
function DriverRegistrationView({ onSuccess }) {
  const { registerDriver } = useDriverStore();
  const [form, setForm] = useState({
    vehicleType: "MOTORCYCLE",
    vehicleNumber: "",
    licenseNumber: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.vehicleNumber || !form.licenseNumber) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      await registerDriver(form);
      await onSuccess();
      toast.success("Welcome to the FoodRush driver family! 🎉");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed. Try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ background: CARD, borderRadius: 24, padding: "36px 32px", maxWidth: 440, width: "100%",
        border: `1px solid ${INK_HAIR}`, boxShadow: `0 8px 32px rgba(28,18,8,0.08)` }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `${TC}12`,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "2rem" }}>
            🛵
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: INK, marginBottom: 8 }}>
            Become a Driver
          </h2>
          <p style={{ fontSize: "0.9rem", color: INK_SOFT, lineHeight: 1.6 }}>
            Join our delivery fleet and earn on your own schedule!
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 6 }}>
              Vehicle Type
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {["MOTORCYCLE", "BICYCLE", "CAR"].map((v) => (
                <button key={v} onClick={() => setForm((p) => ({ ...p, vehicleType: v }))} style={{
                  flex: 1, padding: "9px", borderRadius: 10, border: `1.5px solid`,
                  borderColor: form.vehicleType === v ? TC : INK_HAIR,
                  background: form.vehicleType === v ? `${TC}08` : FIELD,
                  color: form.vehicleType === v ? TC : INK_SOFT,
                  fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                }}>
                  {v === "MOTORCYCLE" ? "🏍 Moto" : v === "BICYCLE" ? "🚲 Bike" : "🚗 Car"}
                </button>
              ))}
            </div>
          </div>
          {[
            { label: "Vehicle Number", key: "vehicleNumber", placeholder: "e.g. DL 01 AB 1234" },
            { label: "License Number", key: "licenseNumber", placeholder: "Driver's license" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 6 }}>
                {label}
              </label>
              <input value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: "100%", padding: "11px 14px", background: FIELD, borderRadius: 10,
                  border: "1.5px solid transparent", fontSize: "0.9rem", color: INK,
                  fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = TC}
                onBlur={(e) => e.target.style.borderColor = "transparent"}
              />
            </div>
          ))}
        </div>

        <button onClick={handleRegister} disabled={loading} style={{
          width: "100%", marginTop: 24, padding: "13px", borderRadius: 12, border: "none",
          background: `linear-gradient(135deg,${TC_SOFT},${TC})`, color: "#FFF5E6",
          fontWeight: 700, fontSize: "0.92rem", cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "var(--font-sans)", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, boxShadow: `0 4px 16px ${TC}35`, opacity: loading ? 0.7 : 1,
        }}>
          {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
          Register as Driver
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
