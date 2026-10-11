import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import toast from "react-hot-toast";
import {
  Navigation, Package, CheckCircle, Loader2, Wifi, WifiOff,
  MapPin, Clock, Truck
} from "lucide-react";
import { useDriverStore } from "../../store/driverStore";
import { useAuthStore } from "../../store/authStore";
import socketService from "../../services/socketService";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const TC = "#C0401E";
const TC_SOFT = "#DE6A40";
const SUCCESS = "#15803D";
const SAFFRON = "#D4882A";
const INK = "#1C1208";
const INK_MUTED = "rgba(28,18,8,0.38)";
const INK_HAIR = "rgba(28,18,8,0.07)";
const CARD = "#FFF9EE";
const FIELD = "#F5ECD8";

const makeIcon = (emoji, color) => L.divIcon({
  className: "",
  html: `<div style="width:44px;height:44px;border-radius:50%;background:${color};
    border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;font-size:20px">${emoji}</div>`,
  iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -44],
});
const driverIcon = makeIcon("🛵", SUCCESS);
const restIcon = makeIcon("🍽", TC);
const homeIcon = makeIcon("🏠", SAFFRON);

/*
 * Backend Delivery Lifecycle:
 *  1. Customer places order → order-service publishes "order-placed" to Kafka
 *  2. delivery-service creates Delivery (PENDING) → attemptDriverAssignment()
 *  3. DriverMatchingService finds nearest ONLINE driver via Redis GEO
 *  4. Driver auto-assigned (DRIVER_ASSIGNED), driver status → ASSIGNED
 *  5. DeliveryScheduler retries every 30s for unmatched PENDING deliveries
 *  6. Driver confirms pickup → PICKED_UP
 *  7. Driver completes delivery → DELIVERED, driver back to ONLINE
 */
const DELIVERY_STEPS = [
  { key: "DRIVER_ASSIGNED", label: "Assigned", emoji: "📋", desc: "Head to the restaurant" },
  { key: "PICKED_UP", label: "Picked Up", emoji: "📦", desc: "Delivering to customer" },
  { key: "DELIVERED", label: "Delivered", emoji: "✅", desc: "Order complete!" },
];

function MapFlyTo({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15, { animate: true, duration: 1 });
  }, [pos?.[0], pos?.[1]]);
  return null;
}

export default function DriverHome() {
  const { user } = useAuthStore();
  const {
    driverProfile, activeDelivery, isOnline, currentLocation,
    fetchProfile, goOnline, goOffline,
    startLocationTracking, stopLocationTracking,
    fetchActiveDelivery, confirmPickup, completeDelivery, registerDriver,
  } = useDriverStore();

  const [toggling, setToggling] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]);
  const locTimer = useRef(null);
  const prevDeliveryId = useRef(null);

  // Fetch profile + active delivery on mount
  useEffect(() => {
    fetchProfile().catch(() => { });
    fetchActiveDelivery().catch(() => { });
  }, []);

  // Poll for active delivery every 10s when online (this is how driver discovers assignments)
  useEffect(() => {
    if (!isOnline || !driverProfile) return;
    const t = setInterval(() => {
      fetchActiveDelivery().then((delivery) => {
        // Notify driver when a new delivery is assigned
        if (delivery?.deliveryId && delivery.deliveryId !== prevDeliveryId.current) {
          prevDeliveryId.current = delivery.deliveryId;
          toast.success("🔔 New delivery assigned! Head to the restaurant.", { duration: 6000 });
        }
      });
    }, 10000);
    return () => clearInterval(t);
  }, [isOnline, driverProfile?.driverId]);

  // Track current delivery ID for notification
  useEffect(() => {
    if (activeDelivery?.deliveryId) prevDeliveryId.current = activeDelivery.deliveryId;
  }, [activeDelivery?.deliveryId]);

  useEffect(() => {
    if (currentLocation) setMapCenter([currentLocation.latitude, currentLocation.longitude]);
  }, [currentLocation]);

  // Auto-start location tracking when online
  useEffect(() => {
    if (isOnline && driverProfile) {
      startLocationTracking();
    }
    return () => {
      if (!isOnline) stopLocationTracking();
    };
  }, [isOnline, driverProfile?.driverId]);

  // WebSocket — listen for order updates (if server publishes to driver topic)
  useEffect(() => {
    if (!driverProfile?.driverId) return;
    let sub;
    const subscribe = () => {
      sub = socketService.subscribeToDriverAssignments(driverProfile.driverId, () => {
        fetchActiveDelivery();
      });
    };
    if (socketService.isConnected()) subscribe();
    else socketService.onConnect(subscribe);
    return () => { if (typeof sub?.unsubscribe === "function") sub.unsubscribe(); };
  }, [driverProfile?.driverId]);

  // Send location via WebSocket for live tracking
  useEffect(() => {
    if (!isOnline || !currentLocation || !activeDelivery) return;
    const send = () => socketService.sendDriverLocation(
      activeDelivery.orderId, driverProfile?.driverId,
      currentLocation.latitude, currentLocation.longitude
    );
    locTimer.current = setInterval(send, 5000);
    send();
    return () => clearInterval(locTimer.current);
  }, [isOnline, currentLocation?.latitude, currentLocation?.longitude, activeDelivery?.orderId]);

  const handleToggle = useCallback(async () => {
    if (toggling) return;
    setToggling(true);
    try {
      if (isOnline) {
        await goOffline();
        clearInterval(locTimer.current);
        toast.success("You're offline. Rest well! 😴");
      } else {
        const pos = await new Promise(res =>
          navigator.geolocation.getCurrentPosition(
            res,
            () => res({ coords: { latitude: 28.6139, longitude: 77.209 } }),
            { timeout: 8000 }
          )
        );
        await goOnline(pos.coords.latitude, pos.coords.longitude);
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        toast.success("You're online! Ready for deliveries 🚀");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
    setToggling(false);
  }, [isOnline, toggling]);

  const handlePickup = async () => {
    setActionBusy(true);
    try { 
      await confirmPickup(); 
      toast.success("Pickup confirmed! Head to the customer 🏠"); 
    }
    catch (err) { toast.error(err?.response?.data?.message || "Failed to confirm pickup"); }
    setActionBusy(false);
  };

  const handleComplete = async () => {
    setActionBusy(true);
    try { 
      await completeDelivery(); 
      toast.success("Delivery complete! Great job 🎉"); 
    }
    catch (err) { toast.error(err?.response?.data?.message || "Failed to complete delivery"); }
    setActionBusy(false);
  };

  // Show registration screen if no driver profile
  if (!driverProfile) return <RegisterScreen user={user} onSuccess={async () => { await fetchProfile(); }} />;

  const locPos = currentLocation ? [currentLocation.latitude, currentLocation.longitude] : null;
  const pickPos = activeDelivery?.pickupLatitude ? [parseFloat(activeDelivery.pickupLatitude), parseFloat(activeDelivery.pickupLongitude)] : null;
  const custPos = activeDelivery?.dropoffLatitude ? [parseFloat(activeDelivery.dropoffLatitude), parseFloat(activeDelivery.dropoffLongitude)] : null;
  // Backend DeliveryStatus: DRIVER_ASSIGNED, PICKED_UP, IN_TRANSIT
  const dStatus = activeDelivery?.status || "";
  const isPickedUp = dStatus === "PICKED_UP" || dStatus === "IN_TRANSIT";
  const currentStep = DELIVERY_STEPS.findIndex(s => s.key === dStatus);

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 500,
              color: INK, letterSpacing: "-0.02em"
            }}>
              Hey, {driverProfile?.name || (user?.name ? user.name.split(" ")[0] : "Driver")} 👋
            </h2>
            <p style={{ fontSize: "0.8rem", color: INK_MUTED, marginTop: 3 }}>
              {driverProfile.vehicleType} · {driverProfile.vehicleNumber || driverProfile.vehicleNum || "—"}
            </p>
          </div>
          <button onClick={handleToggle} disabled={toggling} style={{
            padding: "12px 18px", borderRadius: 14, border: "none",
            background: isOnline
              ? "linear-gradient(135deg,#16A34A,#15803D)"
              : `linear-gradient(135deg,${TC_SOFT},${TC})`,
            color: "#FFF5E6", fontWeight: 700, fontSize: "0.9rem",
            cursor: toggling ? "not-allowed" : "pointer",
            boxShadow: isOnline ? "0 4px 16px rgba(21,128,61,0.45)" : `0 4px 16px ${TC}50`,
            display: "flex", alignItems: "center", gap: 8, opacity: toggling ? 0.7 : 1,
            transition: "all 0.3s"
          }}>
            {toggling
              ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              : isOnline ? <WifiOff size={16} /> : <Wifi size={16} />}
            {isOnline ? "Go Offline" : "Go Online"}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <StatCard label="Active" value={activeDelivery ? "1" : "0"} emoji="📦" highlight={!!activeDelivery} color={TC} />
          <StatCard label="Status" value={isOnline ? "Online" : "Offline"} emoji={isOnline ? "🟢" : "⚫"} highlight={isOnline} color={SUCCESS} />
        </div>
      </div>

      {/* ─── Active delivery card with step-by-step lifecycle ─── */}
      {activeDelivery ? (
        <div style={{
          margin: "0 16px 20px", background: "#FFF", borderRadius: 20,
          border: `2px solid ${TC}25`, overflow: "hidden", boxShadow: `0 6px 24px ${TC}15`
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${TC_SOFT}12, ${TC}06)`,
            padding: "18px 20px", borderBottom: `1px solid ${INK_HAIR}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{
                  fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.12em", color: INK_MUTED
                }}>Active Delivery</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: INK, marginTop: 2 }}>
                  #{(activeDelivery.orderId || "").slice(-6).toUpperCase()}
                </div>
              </div>
              <span style={{
                padding: "6px 14px", borderRadius: 999,
                background: isPickedUp ? `${SUCCESS}12` : `${TC}10`,
                color: isPickedUp ? SUCCESS : TC, fontSize: "0.75rem", fontWeight: 700
              }}>
                {isPickedUp ? "In Transit" : "Assigned"}
              </span>
            </div>
          </div>

          {/* ─── Delivery Progress Steps ─── */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${INK_HAIR}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {DELIVERY_STEPS.map((step, i) => {
                const done = currentStep >= i;
                const active = currentStep === i;
                return (
                  <div key={step.key} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: done ? (active ? `linear-gradient(135deg,${TC_SOFT},${TC})` : `${SUCCESS}15`) : INK_HAIR,
                        border: active ? `2px solid ${TC}` : `2px solid ${done ? SUCCESS : "transparent"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1rem", transition: "all 0.3s",
                        boxShadow: active ? `0 0 0 4px ${TC}15` : "none",
                      }}>
                        {done && !active ? "✓" : step.emoji}
                      </div>
                      <span style={{
                        fontSize: "0.62rem", fontWeight: 700, marginTop: 4,
                        color: active ? TC : done ? SUCCESS : INK_MUTED,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>{step.label}</span>
                    </div>
                    {i < DELIVERY_STEPS.length - 1 && (
                      <div style={{
                        flex: 1, height: 2, margin: "0 6px",
                        background: currentStep > i ? SUCCESS : INK_HAIR,
                        borderRadius: 1, marginBottom: 18,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "18px 20px" }}>
            {/* Route info */}
            <RouteStop icon="🍽" label={isPickedUp ? "Picked up from" : "Pick up from"}
              name={activeDelivery.restaurantName || "Restaurant"}
              addr={activeDelivery.pickupAddress || "Restaurant address"} color={TC}
              done={isPickedUp} />
            <div style={{ width: 2, height: 20, background: INK_HAIR, marginLeft: 21, marginTop: 4, marginBottom: 4 }} />
            <RouteStop icon="🏠" label="Deliver to"
              name="Customer"
              addr={activeDelivery.dropoffAddress || "Customer address"} color={SAFFRON}
              active={isPickedUp} />

            {/* Estimated time */}
            {activeDelivery.estimatedDeliveryMins > 0 && (
              <div style={{
                marginTop: 14, padding: "10px 14px", background: `${SAFFRON}08`,
                borderRadius: 10, fontSize: "0.82rem", color: SAFFRON, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6, border: `1px solid ${SAFFRON}15`
              }}>
                <Clock size={14} /> Estimated: {activeDelivery.estimatedDeliveryMins} mins
              </div>
            )}

            {/* Action button */}
            <button onClick={isPickedUp ? handleComplete : handlePickup} disabled={actionBusy}
              style={{
                width: "100%", marginTop: 18, padding: "16px", borderRadius: 14, border: "none",
                background: isPickedUp
                  ? "linear-gradient(135deg,#16A34A,#15803D)"
                  : `linear-gradient(135deg,${TC_SOFT},${TC})`,
                color: "#FFF5E6", fontWeight: 700, fontSize: "1rem",
                cursor: actionBusy ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 10,
                boxShadow: isPickedUp ? "0 6px 20px rgba(21,128,61,0.4)" : `0 6px 20px ${TC}40`,
                opacity: actionBusy ? 0.7 : 1, transition: "all 0.3s"
              }}>
              {actionBusy
                ? <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                : isPickedUp
                  ? <><CheckCircle size={20} /> Mark Delivered</>
                  : <><Package size={20} /> Confirm Pickup</>}
            </button>

            {/* Help text */}
            <p style={{ textAlign: "center", fontSize: "0.74rem", color: INK_MUTED, marginTop: 10 }}>
              {isPickedUp
                ? "Tap 'Mark Delivered' once you've handed the order to the customer"
                : "Head to the restaurant and tap 'Confirm Pickup' when you have the order"}
            </p>
          </div>
        </div>
      ) : (
        /* ── No active delivery ── */
        <div style={{
          margin: "0 16px 20px", background: CARD, borderRadius: 20,
          border: `1.5px dashed ${INK_HAIR}`, padding: "32px 24px", textAlign: "center"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>{isOnline ? "⏳" : "💤"}</div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: INK, marginBottom: 6 }}>
            {isOnline ? "Waiting for a delivery..." : "You're offline"}
          </h3>
          <p style={{ fontSize: "0.84rem", color: INK_MUTED, lineHeight: 1.6 }}>
            {isOnline
              ? "Stay in the app. When a customer places an order near you, it will be assigned to you automatically."
              : "Tap 'Go Online' to start accepting deliveries."}
          </p>
        </div>
      )}

      {/* ─── How It Works (shown when no delivery and online) ─── */}
      {!activeDelivery && isOnline && (
        <div style={{
          margin: "0 16px 20px", background: CARD, borderRadius: 18,
          border: `1px solid ${INK_HAIR}`, padding: "20px"
        }}>
          <h3 style={{
            fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.12em", color: INK_MUTED, marginBottom: 14
          }}>
            <Truck size={12} style={{ marginRight: 6 }} />
            How Deliveries Work
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { step: "1", title: "Auto-Assignment", desc: "When a customer orders nearby, the system finds the closest online driver — that's you!", emoji: "🔔" },
              { step: "2", title: "Head to Restaurant", desc: "Navigate to the restaurant to pick up the order", emoji: "🍽" },
              { step: "3", title: "Confirm Pickup", desc: "Tap 'Confirm Pickup' when you have the food", emoji: "📦" },
              { step: "4", title: "Deliver to Customer", desc: "Follow the route to the customer's location", emoji: "🏠" },
              { step: "5", title: "Mark Delivered", desc: "Tap 'Mark Delivered' after handing over the order. You're back online!", emoji: "✅" },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: `${TC}08`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", flexShrink: 0
                }}>{s.emoji}</div>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: INK }}>{s.title}</div>
                  <div style={{ fontSize: "0.74rem", color: INK_MUTED, marginTop: 1 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Map */}
      <div style={{
        margin: "0 16px", borderRadius: 20, overflow: "hidden",
        border: `1px solid ${INK_HAIR}`, height: 280, boxShadow: "0 4px 20px rgba(28,18,8,0.08)"
      }}>
        <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors' />
          <MapFlyTo pos={locPos || (pickPos ? pickPos : undefined)} />
          {locPos && <Marker position={locPos} icon={driverIcon}><Popup>📍 You are here</Popup></Marker>}
          {pickPos && <Marker position={pickPos} icon={restIcon}><Popup>🍽 {activeDelivery?.restaurantName || "Restaurant"}</Popup></Marker>}
          {custPos && <Marker position={custPos} icon={homeIcon}><Popup>🏠 Customer</Popup></Marker>}
          {locPos && pickPos && !isPickedUp && (
            <Polyline positions={[locPos, pickPos]} color={TC} weight={3} opacity={0.7} dashArray="8 6" />
          )}
          {locPos && custPos && isPickedUp && (
            <Polyline positions={[locPos, custPos]} color={SUCCESS} weight={3} opacity={0.8} />
          )}
        </MapContainer>
      </div>

      {currentLocation && (
        <div style={{
          margin: "12px 16px 0", padding: "10px 14px", background: CARD,
          borderRadius: 10, border: `1px solid ${INK_HAIR}`,
          display: "flex", alignItems: "center", gap: 8
        }}>
          <Navigation size={13} style={{ color: SUCCESS }} />
          <span style={{ fontSize: "0.76rem", color: INK_MUTED }}>
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </span>
          <span style={{
            marginLeft: "auto", fontSize: "0.68rem", fontWeight: 800,
            color: SUCCESS, textTransform: "uppercase", letterSpacing: "0.08em"
          }}>LIVE</span>
        </div>
      )}

      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slide-in { from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, emoji, highlight, color }) {
  return (
    <div style={{
      background: highlight ? `${color}10` : CARD, borderRadius: 16, padding: "16px 18px",
      border: `1px solid ${highlight ? color + "25" : INK_HAIR}`
    }}>
      <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>{emoji}</div>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 500,
        color: highlight ? color : INK
      }}>{value}</div>
      <div style={{
        fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: INK_MUTED, marginTop: 3
      }}>{label}</div>
    </div>
  );
}

function RouteStop({ icon, label, name, addr, color, done, active }) {
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      opacity: done && !active ? 0.5 : 1
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%", background: `${color}10`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: "1.1rem",
        border: active ? `2px solid ${color}` : "none"
      }}>{icon}</div>
      <div>
        <div style={{
          fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 2
        }}>{label}</div>
        <div style={{
          fontSize: "0.9rem", fontWeight: 700, color: INK,
          textDecoration: done && !active ? "line-through" : "none"
        }}>{name}</div>
        <div style={{ fontSize: "0.76rem", color: INK_MUTED, marginTop: 2 }}>{addr}</div>
      </div>
    </div>
  );
}

function RegisterScreen({ user, onSuccess }) {
  const { registerDriver } = useDriverStore();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    vehicleType: "MOTORCYCLE",
    vehicleNumber: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.phone.trim()) return toast.error("Phone number is required");
    if (!form.vehicleNumber.trim()) return toast.error("Vehicle number is required");

    setLoading(true);
    try {
      await registerDriver(form);
      await onSuccess();
      toast.success("Welcome aboard! 🎉");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed. Try again.");
    }
    setLoading(false);
  };

  const s = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const iStyle = {
    width: "100%", padding: "13px 15px", background: FIELD, borderRadius: 12,
    border: "1.5px solid transparent", fontSize: "0.95rem", color: INK,
    fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s"
  };

  return (
    <div style={{ padding: "32px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>🛵</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: INK, marginBottom: 8 }}>
          Register as Driver
        </h2>
        <p style={{ fontSize: "0.9rem", color: INK_MUTED, lineHeight: 1.6 }}>
          Fill in your details to start delivering on FoodRush
        </p>
      </div>

      <div style={{ background: CARD, borderRadius: 20, padding: "24px", border: `1px solid ${INK_HAIR}` }}>
        {/* Vehicle type */}
        <div style={{ marginBottom: 18 }}>
          <label style={{
            display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 8
          }}>Vehicle Type</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[["MOTORCYCLE", "🏍 Moto"], ["BICYCLE", "🚲 Bike"], ["CAR", "🚗 Car"]].map(([v, label]) => (
              <button key={v} onClick={() => setForm(p => ({ ...p, vehicleType: v }))} style={{
                flex: 1, padding: "10px 4px", borderRadius: 10, border: "1.5px solid",
                borderColor: form.vehicleType === v ? TC : INK_HAIR,
                background: form.vehicleType === v ? `${TC}08` : "transparent",
                color: form.vehicleType === v ? TC : INK_MUTED,
                fontSize: "0.8rem", fontWeight: 600, cursor: "pointer"
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 7
          }}>Full Name *</label>
          <input value={form.name} onChange={s("name")} placeholder="Your full name"
            style={iStyle} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = "transparent"} />
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 7
          }}>Phone Number *</label>
          <input value={form.phone} onChange={s("phone")} placeholder="+91 98765 43210"
            style={iStyle} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = "transparent"} />
        </div>

        {/* Vehicle number */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 7
          }}>Vehicle Number *</label>
          <input value={form.vehicleNumber} onChange={s("vehicleNumber")} placeholder="e.g. DL 01 AB 1234"
            style={iStyle} onFocus={e => e.target.style.borderColor = TC} onBlur={e => e.target.style.borderColor = "transparent"} />
        </div>

        <button onClick={handleRegister} disabled={loading} style={{
          width: "100%", marginTop: 8,
          padding: "15px", borderRadius: 14, border: "none",
          background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`, color: "#FFF5E6",
          fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "var(--font-sans)", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10, boxShadow: `0 6px 20px ${TC}40`,
          opacity: loading ? 0.7 : 1
        }}>
          {loading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
          Register as Driver
        </button>
      </div>
    </div>
  );
}
