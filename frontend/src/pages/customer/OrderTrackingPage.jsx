import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { Package, MapPin, Clock, Phone, User, CheckCircle, XCircle, ArrowLeft, Loader2, Navigation, Bike } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../../api/axios";

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const INK = "#1C1208";
const INK_SOFT = "rgba(28,18,8,0.58)";
const INK_MUTED = "rgba(28,18,8,0.38)";
const INK_HAIR = "rgba(28,18,8,0.07)";
const CREAM = "#FEFCF8";
const CARD = "#FFF9EE";
const TC = "#C0401E";
const TC_SOFT = "#DE6A40";
const TC_DEEP = "#8B2910";
const SUCCESS = "#15803D";
const SAFFRON = "#D4882A";

// Custom marker icons
const restaurantIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='18' fill='%23C0401E'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='20'%3E🍽%3C/text%3E%3C/svg%3E",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const driverIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='18' fill='%2315803D'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='20'%3E🛵%3C/text%3E%3C/svg%3E",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const homeIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='18' fill='%23D4882A'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='20'%3E🏠%3C/text%3E%3C/svg%3E",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Component to update map view when driver moves
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

/**
 * Status mapping: backend Order uses CREATED/CONFIRMED/PICKED_UP
 * We normalize both old frontend names and backend names
 */
const normalizeStatus = (s) => {
  if (!s) return s;
  const map = { PLACED: "CREATED", ACCEPTED: "CONFIRMED", OUT_FOR_DELIVERY: "PICKED_UP" };
  return map[s] || s;
};

// Status messages for each step
const STATUS_MESSAGES = {
  CREATED:   { emoji: "📝", title: "Order placed!", subtitle: "Waiting for restaurant to accept...", color: "#1D4ED8" },
  CONFIRMED: { emoji: "✅", title: "Restaurant accepted!", subtitle: "Your food is about to be prepared", color: "#6D28D9" },
  PREPARING: { emoji: "👨‍🍳", title: "Being prepared", subtitle: "The chef is cooking your food right now", color: "#D97706" },
  READY:     { emoji: "📦", title: "Ready for pickup!", subtitle: "Waiting for delivery partner...", color: "#059669" },
  PICKED_UP: { emoji: "🛵", title: "On the way!", subtitle: "Your delivery partner is heading to you", color: TC },
  DELIVERED: { emoji: "🎉", title: "Delivered!", subtitle: "Enjoy your meal!", color: SUCCESS },
  COMPLETED: { emoji: "🎉", title: "Completed!", subtitle: "Thanks for your order!", color: SUCCESS },
  CANCELLED: { emoji: "❌", title: "Cancelled", subtitle: "This order has been cancelled", color: "#DC2626" },
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status steps for timeline — using backend enum names
  const statusSteps = [
    { key: "CREATED",   label: "Order Placed", icon: Package },
    { key: "CONFIRMED", label: "Restaurant Accepted", icon: CheckCircle },
    { key: "PREPARING", label: "Preparing Food", icon: Package },
    { key: "READY",     label: "Ready for Pickup", icon: CheckCircle },
    { key: "PICKED_UP", label: "On the Way", icon: Bike },
    { key: "DELIVERED", label: "Delivered", icon: CheckCircle },
  ];

  // Fetch order details + delivery info + poll
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        const orderData = { ...res.data, status: normalizeStatus(res.data.status) };
        setOrder(orderData);
        setLoading(false);

        // Always try to fetch delivery info for driver data
        fetchDeliveryStatus();
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setLoading(false);
      }
    };
    fetchAll();

    // Poll for updates every 8s
    const interval = setInterval(fetchAll, 8000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Fetch delivery info from delivery-service
  const fetchDeliveryStatus = async () => {
    try {
      const res = await api.get(`/delivery/${orderId}/status`);
      const info = res.data;
      setDeliveryInfo(info);

      // Extract driver location from DeliveryResponse
      // Backend fields: driverLatitude, driverLongitude
      if (info.driverLatitude && info.driverLongitude) {
        const lat = parseFloat(info.driverLatitude);
        const lng = parseFloat(info.driverLongitude);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          setDriverLocation([lat, lng]);
        }
      }

      // Set ETA from delivery info
      if (info.estimatedDeliveryMins) {
        setEta(`~${info.estimatedDeliveryMins} mins`);
      }
    } catch (err) {
      // Delivery-service might not have a record yet for new orders
      console.log("Delivery API not available yet:", err?.response?.status || err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: TC }} />
        <div style={{ fontSize: "1rem", color: INK_SOFT }}>Loading order tracking...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <XCircle size={48} style={{ color: TC, margin: "0 auto 16px" }} />
        <div style={{ fontSize: "1.2rem", color: INK, marginBottom: 8 }}>Order not found</div>
        <button onClick={() => navigate("/orders")} style={{
          padding: "10px 24px", borderRadius: 999, border: "none",
          background: TC, color: "#FFF5E6", cursor: "pointer",
          fontFamily: "var(--font-sans)", fontWeight: 600,
        }}>Back to Orders</button>
      </div>
    );
  }

  const orderStatus = order.status;
  const currentStepIndex = statusSteps.findIndex((s) => s.key === orderStatus);
  const isCancelled = orderStatus === "CANCELLED";
  const isDelivered = orderStatus === "DELIVERED" || orderStatus === "COMPLETED";

  // Show map when driver is assigned and we have location
  const showMap = driverLocation && (orderStatus === "PICKED_UP" || orderStatus === "READY" ||
    deliveryInfo?.status === "DRIVER_ASSIGNED" || deliveryInfo?.status === "PICKED_UP");

  const statusInfo = STATUS_MESSAGES[orderStatus] || STATUS_MESSAGES.CREATED;

  // Driver info from delivery response
  const driverName = deliveryInfo?.driverName;
  const driverPhone = deliveryInfo?.driverPhone;

  // Map locations — use defaults if not available
  const restaurantLocation = [23.2599, 77.4126];
  const deliveryLocation = [23.2699, 77.4226];
  const route = [restaurantLocation, ...(driverLocation ? [driverLocation] : []), deliveryLocation];

  return (
    <div style={{ animation: "fade-up 0.4s ease-out" }}>
      {/* Back button */}
      <button onClick={() => navigate(`/orders/${orderId}`)} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 999, border: `1px solid ${INK_HAIR}`,
        background: CARD, color: INK_SOFT, fontSize: "0.85rem",
        fontFamily: "var(--font-sans)", cursor: "pointer", marginBottom: 24,
      }}>
        <ArrowLeft size={14} /> Order details
      </button>

      {/* Big status banner */}
      <div style={{
        background: `linear-gradient(135deg, #1A1814 0%, #2D2520 100%)`,
        borderRadius: 24, padding: "32px 36px", marginBottom: 24,
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -50, right: -50, width: 200, height: 200,
          borderRadius: "50%", background: `${TC}15`, pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -40, right: 80, width: 160, height: 160,
          borderRadius: "50%", background: `${SAFFRON}10`, pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <span style={{ fontSize: "2.5rem" }}>{statusInfo.emoji}</span>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)", fontSize: "2rem",
                fontWeight: 500, color: "#FFF5E6", letterSpacing: "-0.02em",
                marginBottom: 4,
              }}>{statusInfo.title}</h1>
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>
                {statusInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Order info */}
          <div style={{
            display: "flex", gap: 20, marginTop: 20, paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Order</div>
              <div style={{ fontSize: "0.9rem", color: "#FFF5E6", fontWeight: 600 }}>#{orderId?.slice(-8)}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Restaurant</div>
              <div style={{ fontSize: "0.9rem", color: "#FFF5E6", fontWeight: 600 }}>{order.restaurantName || "Restaurant"}</div>
            </div>
            {eta && (
              <div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>ETA</div>
                <div style={{ fontSize: "0.9rem", color: TC_SOFT, fontWeight: 700 }}>{eta}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="track-grid" style={{ display: "grid", gridTemplateColumns: showMap ? "1fr 400px" : "1fr", gap: 24 }}>
        {/* Left column */}
        <div>
          {/* Status Timeline */}
          <div style={{
            background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
            padding: 28, marginBottom: 20,
          }}>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: "1.1rem",
              fontWeight: 500, color: INK, marginBottom: 24,
            }}>Order Progress</h2>

            {isCancelled ? (
              <div style={{
                background: "#FEF2F2", borderRadius: 12, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 12,
                border: "1px solid #FECACA",
              }}>
                <XCircle size={20} style={{ color: "#DC2626", flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, color: "#991B1B", marginBottom: 2 }}>Order cancelled</p>
                  <p style={{ fontSize: "0.82rem", color: "#DC2626" }}>
                    Locked funds have been released to your wallet.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ position: "relative", paddingLeft: 44 }}>
                {/* Vertical background line */}
                <div style={{
                  position: "absolute", left: 15, top: 8, bottom: 8,
                  width: 2, background: INK_HAIR,
                }} />
                {/* Progress line */}
                <div style={{
                  position: "absolute", left: 15, top: 8,
                  width: 2, zIndex: 1,
                  height: `${Math.min(currentStepIndex / (statusSteps.length - 1), 1) * 100}%`,
                  background: `linear-gradient(180deg, ${TC_SOFT}, ${TC})`,
                  transition: "height 0.5s ease",
                }} />

                {statusSteps.map((step, index) => {
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} style={{
                      position: "relative", marginBottom: index < statusSteps.length - 1 ? 28 : 0,
                      opacity: isActive ? 1 : 0.35,
                      transition: "opacity 0.3s",
                    }}>
                      {/* Circle */}
                      <div style={{
                        position: "absolute", left: -44, top: 0,
                        width: 32, height: 32, borderRadius: "50%",
                        background: isActive
                          ? `linear-gradient(135deg, ${TC_SOFT}, ${TC_DEEP})`
                          : CARD,
                        border: `2px solid ${isActive ? TC : INK_HAIR}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 2,
                        boxShadow: isCurrent ? `0 0 0 4px ${TC}20` : "none",
                        transition: "all 0.3s",
                      }}>
                        <Icon size={14} style={{ color: isActive ? "#FFF5E6" : INK_MUTED }} />
                      </div>

                      {/* Label */}
                      <div>
                        <div style={{
                          fontSize: "0.95rem",
                          fontWeight: isCurrent ? 700 : isActive ? 600 : 400,
                          color: isActive ? INK : INK_MUTED, marginBottom: 2,
                        }}>{step.label}</div>
                        {isCurrent && (
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            marginTop: 4, padding: "3px 10px", borderRadius: 999,
                            background: `${TC}10`, color: TC_DEEP,
                            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}>
                            <span style={{
                              width: 5, height: 5, borderRadius: "50%", background: TC,
                              animation: "pulse 1.5s ease-in-out infinite",
                            }} />
                            Current
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div style={{
            background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
            padding: 28,
          }}>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: "1.1rem",
              fontWeight: 500, color: INK, marginBottom: 18,
            }}>Order Items</h2>

            {order.items?.map((item, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "12px 0", borderBottom: i < order.items.length - 1 ? `1px solid ${INK_HAIR}` : "none",
              }}>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: INK }}>
                    {item.quantity}x {item.name || item.menuItemName}
                  </div>
                  {item.isVeg !== undefined && (
                    <span style={{
                      fontSize: "0.7rem", color: item.isVeg ? SUCCESS : TC,
                      marginTop: 2, display: "inline-block",
                    }}>{item.isVeg ? "🟢 Veg" : "🔺 Non-veg"}</span>
                  )}
                </div>
                <div style={{
                  fontSize: "0.9rem", fontWeight: 700, color: INK,
                  fontFamily: "var(--font-display)",
                }}>₹{(item.price || item.unitPrice || 0) * (item.quantity || 1)}</div>
              </div>
            ))}

            <div style={{
              marginTop: 16, paddingTop: 16, borderTop: `2px solid ${INK_HAIR}`,
              display: "flex", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: INK }}>Total</span>
              <span style={{
                fontSize: "1.1rem", fontWeight: 700, color: TC,
                fontFamily: "var(--font-display)",
              }}>₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Right column - Map or driver info */}
        {showMap ? (
          <div>
            {/* Map */}
            <div style={{
              background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
              overflow: "hidden", marginBottom: 16, height: 380,
            }}>
              <MapContainer
                center={driverLocation || restaurantLocation}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapUpdater center={driverLocation} />

                <Marker position={restaurantLocation} icon={restaurantIcon}>
                  <Popup>{order.restaurantName}</Popup>
                </Marker>

                {driverLocation && (
                  <Marker position={driverLocation} icon={driverIcon}>
                    <Popup>Your delivery driver</Popup>
                  </Marker>
                )}

                <Marker position={deliveryLocation} icon={homeIcon}>
                  <Popup>Your location</Popup>
                </Marker>

                <Polyline positions={route} color={TC} weight={3} opacity={0.7} />
              </MapContainer>
            </div>

            {/* ETA Card */}
            {eta && (
              <div style={{
                background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
                padding: 20, marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: `${TC}12`, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Clock size={20} style={{ color: TC }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: INK_MUTED, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                      Estimated arrival
                    </div>
                    <div style={{
                      fontSize: "1.4rem", fontWeight: 700, color: INK,
                      fontFamily: "var(--font-display)",
                    }}>{eta}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Driver Info */}
            {driverName && (
              <div style={{
                background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
                padding: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#FFF5E6", fontSize: "1.2rem", fontWeight: 700,
                  }}>{driverName.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: INK }}>
                      {driverName}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: INK_MUTED }}>
                      Your delivery driver
                    </div>
                  </div>
                </div>

                {driverPhone && (
                  <a href={`tel:${driverPhone}`} style={{
                    width: "100%", padding: "10px", borderRadius: 12, border: "none",
                    background: `${TC}10`, color: TC, cursor: "pointer",
                    fontFamily: "var(--font-sans)", fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, fontSize: "0.88rem", textDecoration: "none",
                  }}>
                    <Phone size={14} /> Call driver
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Show driver info without map if driver assigned but no location */
          deliveryInfo?.driverName && !showMap ? (
            <div>
              <div style={{
                background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
                padding: 24,
              }}>
                <div style={{
                  fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 16,
                }}>Delivery Partner Assigned</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#FFF5E6", fontSize: "1.4rem", fontWeight: 700,
                  }}>{deliveryInfo.driverName.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: INK }}>{deliveryInfo.driverName}</div>
                    {deliveryInfo.estimatedDeliveryMins > 0 && (
                      <div style={{ fontSize: "0.8rem", color: INK_MUTED, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} /> ETA: ~{deliveryInfo.estimatedDeliveryMins} mins
                      </div>
                    )}
                  </div>
                </div>
                {deliveryInfo.driverPhone && (
                  <a href={`tel:${deliveryInfo.driverPhone}`} style={{
                    width: "100%", marginTop: 16, padding: "10px", borderRadius: 12,
                    background: `${TC}10`, color: TC, fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, fontSize: "0.88rem", textDecoration: "none",
                    fontFamily: "var(--font-sans)",
                  }}>
                    <Phone size={14} /> Call driver
                  </a>
                )}
              </div>
            </div>
          ) : null
        )}
      </div>

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 768px) {
          .track-grid {
            grid-template-columns: 1fr !important;
          }
          .track-grid .leaflet-container {
            height: 260px !important;
          }
        }
      `}</style>
    </div>
  );
}
