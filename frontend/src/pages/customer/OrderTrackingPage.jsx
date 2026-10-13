import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import {
  Package, MapPin, Clock, Phone, User, CheckCircle, XCircle, ArrowLeft,
  Loader2, Navigation, Bike, AlertCircle, ShoppingBag, ChevronRight, RefreshCw, ChefHat,
  Star, Sparkles, X, Send, ThumbsUp, Heart
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import toast from "react-hot-toast";
import api from "../../api/axios";
import socketService from "../../services/socketService";
import { useAuthStore } from "../../store/authStore";
import { useAddressStore, getAddressCoords } from "../../store/addressStore";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const INK        = "#1C1208";
const INK_SOFT   = "rgba(28,18,8,0.58)";
const INK_MUTED  = "rgba(28,18,8,0.38)";
const INK_HAIR   = "rgba(28,18,8,0.07)";
const CARD       = "#FFF9EE";
const TC         = "#C0401E";
const TC_SOFT    = "#DE6A40";
const TC_DEEP    = "#8B2910";
const SUCCESS    = "#15803D";
const SAFFRON    = "#D4882A";
const PISTACHIO  = "#5A7040";

// Custom marker icons
const restaurantIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Ccircle cx='22' cy='22' r='20' fill='%23C0401E' stroke='white' stroke-width='3'/%3E%3Ctext x='22' y='28' text-anchor='middle' font-size='20'%3E🍽%3C/text%3E%3C/svg%3E",
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

const driverIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Ccircle cx='22' cy='22' r='20' fill='%2315803D' stroke='white' stroke-width='3'/%3E%3Ctext x='22' y='28' text-anchor='middle' font-size='20'%3E🛵%3C/text%3E%3C/svg%3E",
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

const homeIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Ccircle cx='22' cy='22' r='20' fill='%23D4882A' stroke='white' stroke-width='3'/%3E%3Ctext x='22' y='28' text-anchor='middle' font-size='20'%3E🏠%3C/text%3E%3C/svg%3E",
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

// MapUpdater to center, fit bounds, and invalidate size
function MapUpdater({ center, dest }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map]);

  useEffect(() => {
    if (center && dest && Array.isArray(center) && Array.isArray(dest) && !isNaN(center[0]) && !isNaN(dest[0])) {
      try {
        const bounds = L.latLngBounds([center, dest]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch (e) {
        if (!isNaN(center[0]) && !isNaN(center[1])) map.setView(center, 14);
      }
    } else if (center && Array.isArray(center) && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom());
    }
  }, [center?.[0], center?.[1], dest?.[0], dest?.[1], map]);
  return null;
}

const normalizeStatus = (s) => {
  if (!s) return "CREATED";
  const map = {
    PLACED: "CREATED",
    ACCEPTED: "CONFIRMED",
    OUT_FOR_DELIVERY: "PICKED_UP",
    DELIVERED: "DELIVERED",
    COMPLETED: "DELIVERED",
    CANCELLED: "CANCELLED"
  };
  return map[s] || s;
};

// Status step definitions
const STATUS_STEPS = [
  { key: "CREATED",   label: "Order Placed",               icon: Package,     desc: "Waiting for restaurant to accept" },
  { key: "CONFIRMED", label: "Restaurant Accepted",        icon: CheckCircle, desc: "Order confirmed by the kitchen" },
  { key: "PREPARING", label: "Food Being Prepared",        icon: ChefHat,     desc: "Chef is preparing your fresh meal" },
  { key: "READY",     label: "Delivery Boy to Restaurant", icon: Bike,        desc: "Rider is heading to pick up your order" },
  { key: "PICKED_UP", label: "Out for Delivery",           icon: Navigation,  desc: "Food picked up! Driver is en route to you" },
  { key: "DELIVERED", label: "Delivered to You",           icon: CheckCircle, desc: "Order delivered! Enjoy your delicious meal" },
];

const STATUS_MESSAGES = {
  CREATED:   { emoji: "📝", title: "Order placed!",              subtitle: "Waiting for restaurant to confirm...", color: "#1D4ED8" },
  CONFIRMED: { emoji: "✅", title: "Restaurant accepted!",       subtitle: "Your food is in line to be prepared", color: "#6D28D9" },
  PREPARING: { emoji: "👨‍🍳", title: "Being freshly cooked!",      subtitle: "The chef is preparing your meal in the kitchen", color: "#D97706" },
  READY:     { emoji: "🛵", title: "Rider to Restaurant",        subtitle: "Delivery partner is heading to collect your food", color: "#059669" },
  PICKED_UP: { emoji: "🛍️", title: "Out for Delivery!",          subtitle: "Driver picked up food and is riding to your address", color: TC },
  DELIVERED: { emoji: "🎉", title: "Order Delivered!",           subtitle: "Delivered successfully! Enjoy your meal!", color: SUCCESS },
  COMPLETED: { emoji: "🎉", title: "Order Delivered!",           subtitle: "Delivered successfully! Enjoy your meal!", color: SUCCESS },
  CANCELLED: { emoji: "❌", title: "Order Cancelled",            subtitle: "This order has been cancelled and refunded to wallet", color: "#DC2626" },
};

function getDistanceKm(p1, p2) {
  if (!p1 || !p2) return 0;
  const R = 6371;
  const dLat = (p2[0] - p1[0]) * Math.PI / 180;
  const dLon = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fetch multi-path road geometries from OSRM driving service:
// - Primary Route: Fastest main road route (default / low traffic)
// - Alternate Route: Bypass shortcut route (traffic diversion / alternative corridor)
async function fetchRoadRoutes(start, end) {
  if (!start || !end) return { primary: [], alternate: [] };
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=true`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const primary = data.routes[0]?.geometry?.coordinates?.map(c => [c[1], c[0]]) || [];
        let alternate = data.routes[1]?.geometry?.coordinates?.map(c => [c[1], c[0]]) || [];

        // If OSRM didn't return an alternate route, synthesize an intelligent arterial bypass
        if (alternate.length === 0 && primary.length > 3) {
          const midIdx = Math.floor(primary.length / 2);
          const midPt = primary[midIdx];
          const bypassWaypoint = [midPt[0] + 0.0032, midPt[1] - 0.0035];
          try {
            const altUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${bypassWaypoint[1]},${bypassWaypoint[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
            const altRes = await fetch(altUrl);
            if (altRes.ok) {
              const altData = await altRes.json();
              if (altData.routes && altData.routes[0]?.geometry?.coordinates?.length) {
                alternate = altData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              }
            }
          } catch (e) {
            // fallback
          }
        }

        return { primary, alternate };
      }
    }
  } catch (err) {
    console.warn("OSRM road route fetch fallback:", err);
  }

  // Smooth road curvature fallback
  const steps = 14;
  const primary = [];
  const alternate = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat1 = start[0] + (end[0] - start[0]) * t + (i > 0 && i < steps ? Math.sin(i * 1.4) * 0.0006 : 0);
    const lng1 = start[1] + (end[1] - start[1]) * t + (i > 0 && i < steps ? Math.cos(i * 1.3) * 0.0006 : 0);
    primary.push([lat1, lng1]);

    const lat2 = start[0] + (end[0] - start[0]) * t + (i > 0 && i < steps ? Math.sin(i * 1.2) * 0.0018 : 0);
    const lng2 = start[1] + (end[1] - start[1]) * t + (i > 0 && i < steps ? -Math.cos(i * 1.2) * 0.0018 : 0);
    alternate.push([lat2, lng2]);
  }
  return { primary, alternate };
}

function sliceCompletedRoadRoute(fullRoute, currentPos) {
  if (!fullRoute || fullRoute.length === 0) return [];
  if (!currentPos) return fullRoute;

  let closestIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < fullRoute.length; i++) {
    const d = getDistanceKm(currentPos, fullRoute[i]);
    if (d < minDist) {
      minDist = d;
      closestIdx = i;
    }
  }
  const remaining = fullRoute.slice(closestIdx);
  return [currentPos, ...remaining];
}

function calculatePolylineDistanceKm(pts) {
  if (!pts || pts.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += getDistanceKm(pts[i], pts[i + 1]);
  }
  return total;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const navigate = useNavigate();

  const [activeOrderId, setActiveOrderId] = useState(params.orderId && params.orderId !== "track" ? params.orderId : null);
  const [order, setOrder] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noOrdersFound, setNoOrdersFound] = useState(false);
  const [routeMode, setRouteMode] = useState("fastest"); // "fastest" | "bypass"
  const [roadRoute, setRoadRoute] = useState([]);
  const [remainingRoadRoute, setRemainingRoadRoute] = useState([]);
  const [remainingKm, setRemainingKm] = useState(0);
  const [alternateRoadRoute, setAlternateRoadRoute] = useState([]);
  const [remainingAlternateRoute, setRemainingAlternateRoute] = useState([]);
  const [alternateKm, setAlternateKm] = useState(0);
  const routeTargetKey = useRef("");

  const user = useAuthStore((s) => s.user);
  const { addresses, fetchAddresses, selectedAddressId } = useAddressStore();

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Target address selected by customer in My Addresses or attached to order
  const targetAddressObj = useMemo(() => {
    if (!addresses || addresses.length === 0) return null;
    if (order?.deliveryAddressId) {
      const found = addresses.find((a) => a.addressId === order.deliveryAddressId);
      if (found) return found;
    }
    if (order?.deliveryAddress) {
      const dAddr = order.deliveryAddress.toLowerCase();
      const byStreet = addresses.find((a) => a.street && dAddr.includes(a.street.toLowerCase()));
      if (byStreet) return byStreet;
      const byCity = addresses.find((a) => a.city && dAddr.includes(a.city.toLowerCase()));
      if (byCity) return byCity;
    }
    if (selectedAddressId) {
      const bySel = addresses.find((a) => a.addressId === selectedAddressId);
      if (bySel) return bySel;
    }
    return addresses[0];
  }, [addresses, order?.deliveryAddressId, order?.deliveryAddress, selectedAddressId]);

  // Clean formatted address to display
  const displayAddress = useMemo(() => {
    if (targetAddressObj) {
      const parts = [targetAddressObj.street, targetAddressObj.city, targetAddressObj.state, targetAddressObj.pincode].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    if (order?.deliveryAddress) {
      return order.deliveryAddress.replace(/^\[.*?\]\s*/, "");
    }
    return "Shree annupurna dham, Adalaj, 382421";
  }, [targetAddressObj, order?.deliveryAddress]);

  // Review & Rating Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [restRating, setRestRating] = useState(5);
  const [restHoverRating, setRestHoverRating] = useState(0);
  const [restComment, setRestComment] = useState("");
  const [restTags, setRestTags] = useState([]);
  const [driverRating, setDriverRating] = useState(5);
  const [driverHoverRating, setDriverHoverRating] = useState(0);
  const [driverComment, setDriverComment] = useState("");
  const [driverTags, setDriverTags] = useState([]);
  const hasAutoOpenedRef = useRef(false);

  // Cancellation States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Check if current order was already reviewed
  useEffect(() => {
    if (activeOrderId) {
      const reviewed = localStorage.getItem(`reviewed_order_${activeOrderId}`);
      if (reviewed === "true") {
        setReviewSubmitted(true);
      }
    }
  }, [activeOrderId]);

  const handleCancelOrder = async () => {
    if (!activeOrderId) return;
    setCancelling(true);
    try {
      await api.post(`/orders/${activeOrderId}/cancel`);
      toast.success("Order cancelled! Funds have been refunded to your wallet. 💸");
      setShowCancelModal(false);
      await fetchOrderAndDelivery(activeOrderId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel order");
    } finally {
      setCancelling(false);
    }
  };

  // Auto-resolve order if orderId is missing or "track"
  const resolveTargetOrder = useCallback(async () => {
    let target = params.orderId;
    if (!target || target === "track") {
      try {
        const myRes = await api.get("/orders/my");
        const list = Array.isArray(myRes.data) ? myRes.data : [];
        if (list.length > 0) {
          // Prefer active order, else most recent order
          const active = list.find(o => !["DELIVERED", "COMPLETED", "CANCELLED"].includes(o.status)) || list[0];
          target = active.orderId;
          setActiveOrderId(target);
        } else {
          setNoOrdersFound(true);
          setLoading(false);
          return null;
        }
      } catch (err) {
        console.error("Failed to load customer orders:", err);
        setNoOrdersFound(true);
        setLoading(false);
        return null;
      }
    } else {
      setActiveOrderId(target);
    }
    return target;
  }, [params.orderId]);

  // Main fetch function
  const fetchOrderAndDelivery = useCallback(async (idToFetch) => {
    if (!idToFetch) return;
    try {
      const res = await api.get(`/orders/${idToFetch}`);
      const orderData = { ...res.data, status: normalizeStatus(res.data.status) };
      setOrder(orderData);
      setLoading(false);

      // Fetch exact restaurant coordinates & address from restaurant-service
      if (orderData.restaurantId) {
        try {
          const rRes = await api.get(`/restaurants/${orderData.restaurantId}`);
          if (rRes.data) {
            setRestaurantDetails(rRes.data);
          }
        } catch (rErr) {
          console.warn("Could not fetch restaurant details:", rErr);
        }
      }

      // Fetch delivery status
      try {
        const dRes = await api.get(`/delivery/${idToFetch}/status`);
        const dInfo = dRes.data;
        setDeliveryInfo(dInfo);

        if (dInfo.driverLatitude && dInfo.driverLongitude) {
          const lat = parseFloat(dInfo.driverLatitude);
          const lng = parseFloat(dInfo.driverLongitude);
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            setDriverLocation([lat, lng]);
          }
        }

        if (dInfo.estimatedDeliveryMins) {
          setEta(`~${dInfo.estimatedDeliveryMins} mins`);
        } else if (orderData.estimatedDeliveryMins) {
          setEta(`~${orderData.estimatedDeliveryMins} mins`);
        }
      } catch (dErr) {
        // Delivery record might not be created yet for new orders
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const id = await resolveTargetOrder();
      if (id && isMounted) {
        await fetchOrderAndDelivery(id);
      }
    })();

    // Poll every 5s for real-time order & rider updates
    const interval = setInterval(async () => {
      if (activeOrderId) {
        await fetchOrderAndDelivery(activeOrderId);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [resolveTargetOrder, fetchOrderAndDelivery, activeOrderId]);

  // Live WebSocket subscription for driver location & status updates
  useEffect(() => {
    if (!activeOrderId) return;
    let unsub = null;

    const setupSub = () => {
      unsub = socketService.subscribeToDriverLocation(activeOrderId, (locUpdate) => {
        if (locUpdate?.latitude && locUpdate?.longitude) {
          const lat = parseFloat(locUpdate.latitude);
          const lng = parseFloat(locUpdate.longitude);
          if (!isNaN(lat) && !isNaN(lng) && lat > 20 && lat < 25) {
            setDriverLocation([lat, lng]);
          }
        }
        if (locUpdate?.estimatedMins) {
          setEta(`~${locUpdate.estimatedMins} mins`);
        }
        if (locUpdate?.status) {
          setOrder(prev => prev ? { ...prev, status: normalizeStatus(locUpdate.status) } : prev);
        }
      });
    };

    if (socketService.isConnected()) {
      setupSub();
    } else {
      socketService.onConnect(setupSub);
    }

    return () => {
      if (typeof unsub?.unsubscribe === "function") unsub.unsubscribe();
    };
  }, [activeOrderId]);

  // Coordinates resolution: supports Adalaj (Shree Annapurna Dham), Surat, Ahmedabad, Rajkot, etc.
  const defaultRestaurant = [23.1644, 72.5855]; // Adalaj fallback
  const defaultCustomer   = [23.16469190, 72.58210460]; // Shree Annapurna Dham, Adalaj fallback

  // Helper to reject outdated Bhopal seed coordinates
  const isBhopalCoords = (lat, lng) => lat && lng && Math.abs(lat - 23.2599) < 0.1 && Math.abs(lng - 77.4126) < 0.1;

  const restaurantLocation = useMemo(() => {
    // 1. Exact coordinates from restaurant record in database
    if (restaurantDetails?.latitude && restaurantDetails?.longitude) {
      const lat = parseFloat(restaurantDetails.latitude);
      const lng = parseFloat(restaurantDetails.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat > 18 && lat < 28 && !isBhopalCoords(lat, lng)) {
        return [lat, lng];
      }
    }
    // 2. From deliveryInfo pickupLatitude/pickupLongitude
    if (deliveryInfo?.pickupLatitude && deliveryInfo?.pickupLongitude) {
      const lat = parseFloat(deliveryInfo.pickupLatitude);
      const lng = parseFloat(deliveryInfo.pickupLongitude);
      if (!isNaN(lat) && !isNaN(lng) && lat > 18 && lat < 28 && !isBhopalCoords(lat, lng)) {
        return [lat, lng];
      }
    }
    // 3. Fallback based on restaurant name or address text (e.g. The leela in Surat)
    const rName = (order?.restaurantName || "").toLowerCase();
    const rAddr = (restaurantDetails?.address || "").toLowerCase();
    const dAddr = (order?.deliveryAddress || "").toLowerCase();
    if (rName.includes("leela") || rAddr.includes("surat") || dAddr.includes("surat")) {
      return [21.17263386, 72.83195231]; // Surat coordinates
    }
    if (rAddr.includes("rajkot") || dAddr.includes("rajkot")) {
      return [22.3039, 70.8022]; // Rajkot coordinates
    }
    if (rAddr.includes("ahmedabad") || dAddr.includes("ahmedabad")) {
      return [23.0225, 72.5714]; // Ahmedabad coordinates
    }
    return defaultRestaurant;
  }, [restaurantDetails, deliveryInfo, order?.restaurantName, order?.deliveryAddress]);

  const deliveryLocation = useMemo(() => {
    // 1. From customer's chosen address in My Addresses / AddressStore
    if (targetAddressObj) {
      const coords = getAddressCoords(targetAddressObj);
      if (coords?.lat && coords?.lng && !isBhopalCoords(coords.lat, coords.lng)) {
        return [coords.lat, coords.lng];
      }
    }
    // 2. From customer's chosen address stored on the order
    if (order?.latitude && order?.longitude) {
      const lat = parseFloat(order.latitude);
      const lng = parseFloat(order.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat > 18 && lat < 28 && !isBhopalCoords(lat, lng)) {
        return [lat, lng];
      }
    }
    // 3. From deliveryInfo dropoff coords
    if (deliveryInfo?.dropoffLatitude && deliveryInfo?.dropoffLongitude) {
      const lat = parseFloat(deliveryInfo.dropoffLatitude);
      const lng = parseFloat(deliveryInfo.dropoffLongitude);
      if (!isNaN(lat) && !isNaN(lng) && lat > 18 && lat < 28 && !isBhopalCoords(lat, lng)) {
        return [lat, lng];
      }
    }
    // 4. Fallback based on delivery address text or restaurant location (Surat / Rajkot / etc.)
    const addr = (order?.deliveryAddress || "").toLowerCase();
    if (addr.includes("annpurna") || addr.includes("annapurna") || addr.includes("adalaj")) {
      return [23.16469190, 72.58210460]; // Shree Annapurna Dham, Adalaj
    }
    if (addr.includes("surat") || (order?.restaurantName || "").toLowerCase().includes("leela") || restaurantLocation[0] < 22.0) {
      return [21.11697090, 72.78540090]; // Surat delivery coordinates
    }
    if (addr.includes("rajkot")) {
      return [22.3039, 70.8022]; // Rajkot
    }
    if (addr.includes("nirma") || addr.includes("tragad")) {
      return [23.12639030, 72.54000890]; // Nirma University
    }
    if (addr.includes("ahmedabad") || addr.includes("chandkheda") || addr.includes("motera")) {
      return [23.0225, 72.5714]; // Ahmedabad
    }
    return defaultCustomer;
  }, [targetAddressObj, order?.latitude, order?.longitude, order?.deliveryAddress, order?.restaurantName, deliveryInfo, restaurantLocation]);

  // Dynamic city name for rider matching and status displays
  const targetCityName = useMemo(() => {
    const rAddr = (restaurantDetails?.address || "").toLowerCase();
    const rName = (order?.restaurantName || "").toLowerCase();
    const dAddr = (order?.deliveryAddress || "").toLowerCase();

    if (rAddr.includes("surat") || rName.includes("leela") || dAddr.includes("surat") || (restaurantLocation && restaurantLocation[0] < 22.0)) {
      return "Surat";
    }
    if (rAddr.includes("rajkot") || dAddr.includes("rajkot")) {
      return "Rajkot";
    }
    if (rAddr.includes("ahmedabad") || dAddr.includes("ahmedabad")) {
      return "Ahmedabad";
    }
    if (rAddr.includes("vadodara") || rAddr.includes("baroda") || dAddr.includes("vadodara")) {
      return "Vadodara";
    }
    if (restaurantDetails?.address) {
      return restaurantDetails.address.split(",")[0].trim();
    }
    return "Adalaj & Gandhinagar";
  }, [restaurantDetails, order?.restaurantName, order?.deliveryAddress, restaurantLocation]);

  const orderStatus = order?.status || "CREATED";
  const isCancelled = orderStatus === "CANCELLED";
  const isDelivered = orderStatus === "DELIVERED" || orderStatus === "COMPLETED";
  const isDriverPickedUp = orderStatus === "PICKED_UP" || deliveryInfo?.status === "PICKED_UP" || deliveryInfo?.status === "IN_TRANSIT" || deliveryInfo?.status === "DELIVERING";
  // User can cancel order anytime until driver has picked up food from restaurant
  const canCancel = !isCancelled && !isDelivered && !isDriverPickedUp;

  // Check if a driver is genuinely assigned to this delivery
  // Strictly FALSE when delivery status is PENDING or no driver has accepted yet!
  const hasDriverAssigned = Boolean(
    (deliveryInfo?.status &&
      !["PENDING", "CANCELLED", "FAILED"].includes(deliveryInfo.status) &&
      ["DRIVER_ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"].includes(deliveryInfo.status)
    ) ||
    (!deliveryInfo && order?.driverId && order?.driverId !== "null" &&
      ["PICKED_UP", "DELIVERED", "COMPLETED"].includes(orderStatus)
    )
  );

  // Effective driver location - STRICTLY NULL when no driver is assigned!
  const effectiveDriverLocation = useMemo(() => {
    if (!hasDriverAssigned) return null;
    if (isDelivered) return deliveryLocation;
    if (driverLocation) return driverLocation;

    if (deliveryInfo?.driverLatitude && deliveryInfo?.driverLongitude) {
      const lat = parseFloat(deliveryInfo.driverLatitude);
      const lng = parseFloat(deliveryInfo.driverLongitude);
      if (!isNaN(lat) && !isNaN(lng) && lat > 20 && lat < 25) {
        return [lat, lng];
      }
    }

    // Rider on the way to restaurant (Phase 1)
    if (!isDriverPickedUp) {
      return [restaurantLocation[0] - 0.005, restaurantLocation[1] - 0.004];
    }
    // Rider on the way to customer (Phase 2)
    return [restaurantLocation[0] - 0.010, restaurantLocation[1] - 0.008];
  }, [hasDriverAssigned, driverLocation, deliveryInfo?.driverLatitude, deliveryInfo?.driverLongitude, isDelivered, isDriverPickedUp, restaurantLocation, deliveryLocation]);

  // Dynamic Navigation Source & Destination:
  // Phase 0 (!hasDriverAssigned || isDelivered): No navigation polyline!
  // Phase 1 (hasDriverAssigned && !isDriverPickedUp): Rider -> Restaurant ONLY (never touches customer house)
  // Phase 2 (hasDriverAssigned && isDriverPickedUp): Rider -> Customer Delivery Address
  const navStart = useMemo(() => {
    if (!hasDriverAssigned || isDelivered) return null;
    return effectiveDriverLocation || restaurantLocation;
  }, [hasDriverAssigned, isDelivered, effectiveDriverLocation, restaurantLocation]);

  const navDest = useMemo(() => {
    if (!hasDriverAssigned || isDelivered) return null;
    return isDriverPickedUp ? deliveryLocation : restaurantLocation;
  }, [hasDriverAssigned, isDelivered, isDriverPickedUp, deliveryLocation, restaurantLocation]);

  // Compute road geometry strictly for the active navigation phase
  useEffect(() => {
    // If no driver assigned or order is delivered, clear route immediately!
    if (!hasDriverAssigned || isDelivered || !navStart || !navDest) {
      setRoadRoute([]);
      setRemainingRoadRoute([]);
      setRemainingKm(0);
      setAlternateRoadRoute([]);
      setRemainingAlternateRoute([]);
      setAlternateKm(0);
      routeTargetKey.current = "";
      return;
    }

    const phase = isDriverPickedUp ? "TO_CUST" : "TO_REST";
    const key = `${phase}_${navStart[0].toFixed(4)}_${navStart[1].toFixed(4)}_${navDest[0].toFixed(4)}_${navDest[1].toFixed(4)}`;

    if (routeTargetKey.current !== key || roadRoute.length === 0) {
      routeTargetKey.current = key;
      setRoadRoute([]);
      setRemainingRoadRoute([]);
      setAlternateRoadRoute([]);
      setRemainingAlternateRoute([]);
      fetchRoadRoutes(navStart, navDest).then((routes) => {
        if (!routes?.primary || routes.primary.length === 0) return;
        setRoadRoute(routes.primary);
        const slicedPrimary = sliceCompletedRoadRoute(routes.primary, navStart);
        setRemainingRoadRoute(slicedPrimary);
        setRemainingKm(calculatePolylineDistanceKm(slicedPrimary));

        if (routes.alternate && routes.alternate.length > 0) {
          setAlternateRoadRoute(routes.alternate);
          const slicedAlt = sliceCompletedRoadRoute(routes.alternate, navStart);
          setRemainingAlternateRoute(slicedAlt);
          setAlternateKm(calculatePolylineDistanceKm(slicedAlt));
        } else {
          setAlternateRoadRoute([]);
          setRemainingAlternateRoute([]);
          setAlternateKm(0);
        }
      });
    } else {
      const slicedPrimary = sliceCompletedRoadRoute(roadRoute, navStart);
      setRemainingRoadRoute(slicedPrimary);
      setRemainingKm(calculatePolylineDistanceKm(slicedPrimary));

      if (alternateRoadRoute.length > 0) {
        const slicedAlt = sliceCompletedRoadRoute(alternateRoadRoute, navStart);
        setRemainingAlternateRoute(slicedAlt);
        setAlternateKm(calculatePolylineDistanceKm(slicedAlt));
      }
    }
  }, [
    hasDriverAssigned,
    isDelivered,
    isDriverPickedUp,
    navStart?.[0],
    navStart?.[1],
    navDest?.[0],
    navDest?.[1]
  ]);

  const activePolyline = routeMode === "fastest" ? remainingRoadRoute : (remainingAlternateRoute.length > 0 ? remainingAlternateRoute : remainingRoadRoute);
  const inactivePolyline = routeMode === "fastest" ? remainingAlternateRoute : remainingRoadRoute;
  const activeDistance = routeMode === "fastest" ? remainingKm : (alternateKm > 0 ? alternateKm : remainingKm);

  // Current step index
  const currentStepIndex = useMemo(() => {
    const idx = STATUS_STEPS.findIndex(s => s.key === orderStatus);
    return idx >= 0 ? idx : 0;
  }, [orderStatus]);

  const statusInfo = STATUS_MESSAGES[orderStatus] || STATUS_MESSAGES.CREATED;
  const driverName = hasDriverAssigned ? (deliveryInfo?.driverName || (order?.driverId ? "Assigned Delivery Partner" : null)) : null;
  const driverPhone = deliveryInfo?.driverPhone || "+91 9876543210";

  // Auto-open review popup modal when order arrives/is delivered
  useEffect(() => {
    if (isDelivered && !hasAutoOpenedRef.current && activeOrderId) {
      const alreadyDismissed = sessionStorage.getItem(`dismissed_review_${activeOrderId}`);
      if (!alreadyDismissed) {
        hasAutoOpenedRef.current = true;
        const timer = setTimeout(() => {
          setShowReviewModal(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isDelivered, activeOrderId]);

  const toggleRestTag = (tag) => {
    setRestTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleDriverTag = (tag) => {
    setDriverTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleDismissModal = () => {
    setShowReviewModal(false);
    if (activeOrderId) {
      sessionStorage.setItem(`dismissed_review_${activeOrderId}`, "true");
    }
    toast("Returning to home page...", { icon: "🏠" });
    navigate("/");
  };

  const handleReviewSubmit = async (e) => {
    e?.preventDefault();
    if (submittingReview) return;
    setSubmittingReview(true);

    try {
      const restId =
        order?.restaurantId ||
        deliveryInfo?.restaurantId ||
        "154b50c6-f2de-49ca-baa3-e5ac8312579e";

      const fullRestComment = [
        restTags.length > 0 ? `Tags: ${restTags.join(", ")}` : "",
        restComment.trim(),
      ]
        .filter(Boolean)
        .join(" | ");

      const fullDriverComment = [
        driverTags.length > 0 ? `Tags: ${driverTags.join(", ")}` : "",
        driverComment.trim(),
      ]
        .filter(Boolean)
        .join(" | ");

      const customerName = user?.fullName || user?.name || "Customer";

      // 1. Submit restaurant review
      try {
        await api.post(`/restaurants/${restId}/reviews`, {
          rating: restRating,
          comment: fullRestComment || "Delicious food and great service!",
          userName: customerName,
        });
      } catch (rErr) {
        console.warn("Restaurant review endpoint warning:", rErr);
      }

      // 2. Submit delivery partner rating
      try {
        await api.post(`/delivery/order/${activeOrderId}/rate-driver`, {
          rating: driverRating,
          comment: fullDriverComment || "Polite, fast, and handled with care!",
        });
      } catch (dErr) {
        console.warn("Driver review endpoint warning:", dErr);
      }

      toast.success("Thank you for your review! Redirecting to home page... 🍕", {
        duration: 2500,
      });
      setReviewSubmitted(true);
      setShowReviewModal(false);
      localStorage.setItem(`reviewed_order_${activeOrderId}`, "true");

      // Redirect to customer home page after review
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      console.error("Failed to submit reviews:", err);
      toast.error("Failed to submit review. Redirecting to home...");
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <Loader2 size={36} style={{ animation: "spin 1s linear infinite", color: TC }} />
        <div style={{ fontSize: "1.05rem", color: INK, fontWeight: 600 }}>Loading live order tracking...</div>
        <p style={{ fontSize: "0.85rem", color: INK_MUTED }}>Connecting to delivery GPS & route network...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // No Orders Screen
  if (noOrdersFound || !order) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center", background: CARD, borderRadius: 24, border: `1.5px dashed ${INK_HAIR}`, maxWidth: 540, margin: "40px auto" }}>
        <Package size={52} style={{ color: TC, margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: INK, marginBottom: 8 }}>No Active Order to Track</h2>
        <p style={{ fontSize: "0.92rem", color: INK_SOFT, marginBottom: 24, lineHeight: 1.5 }}>
          You don't have any ongoing deliveries to track right now. Place an order from any top restaurant within 25 km to follow your food live!
        </p>
        <button onClick={() => navigate("/")} style={{
          padding: "12px 28px", borderRadius: 999, border: "none",
          background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
          color: "#FFF5E6", cursor: "pointer",
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.9rem",
          boxShadow: `0 6px 18px ${TC}40`
        }}>
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: "fade-up 0.4s ease-out", paddingBottom: 60 }}>
      {/* Top Header & Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/orders")} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 999, border: `1px solid ${INK_HAIR}`,
            background: CARD, color: INK_SOFT, fontSize: "0.85rem",
            fontFamily: "var(--font-sans)", cursor: "pointer",
          }}>
            <ArrowLeft size={14} /> My Orders
          </button>
          <button onClick={() => navigate(`/orders/${activeOrderId}`)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 999, border: `1px solid ${INK_HAIR}`,
            background: CARD, color: INK_SOFT, fontSize: "0.85rem",
            fontFamily: "var(--font-sans)", cursor: "pointer",
          }}>
            Order Details
          </button>
          {canCancel && (
            <button onClick={() => setShowCancelModal(true)} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 999, border: `1px solid #FECACA`,
              background: "#FEF2F2", color: "#DC2626", fontSize: "0.85rem",
              fontFamily: "var(--font-sans)", fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s"
            }}>
              <XCircle size={14} /> Cancel Order
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {isDelivered ? (
            <span style={{
              fontSize: "0.78rem", fontWeight: 700, color: SUCCESS,
              background: `${SUCCESS}18`, padding: "6px 14px", borderRadius: 999,
              display: "inline-flex", alignItems: "center", gap: 7,
              border: `1px solid ${SUCCESS}30`
            }}>
              <CheckCircle size={15} /> ORDER DELIVERED & ARRIVED
            </span>
          ) : (
            <span style={{
              fontSize: "0.75rem", fontWeight: 700, color: SUCCESS,
              background: `${SUCCESS}15`, padding: "5px 12px", borderRadius: 999,
              display: "inline-flex", alignItems: "center", gap: 6
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: SUCCESS, animation: "pulse 1.8s infinite" }} />
              LIVE TRACKING ACTIVE
            </span>
          )}

          {isDelivered && (
            <>
              <button
                onClick={() => setShowReviewModal(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 999, border: "none",
                  background: `linear-gradient(135deg, ${SAFFRON}, ${TC})`,
                  color: "#FFF", fontSize: "0.82rem",
                  fontFamily: "var(--font-sans)", fontWeight: 700, cursor: "pointer",
                  boxShadow: `0 4px 14px ${TC}35`,
                  transition: "all 0.2s"
                }}
              >
                <Star size={14} fill="#FFF" /> Give Review ⭐
              </button>
              <button
                onClick={() => navigate("/")}
                title="Go to customer home page"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 999,
                  border: `1px solid ${INK_HAIR}`,
                  background: CARD, color: INK, fontSize: "0.82rem",
                  fontFamily: "var(--font-sans)", fontWeight: 700, cursor: "pointer",
                }}
              >
                🏠 Home
              </button>
            </>
          )}

          <button
            onClick={() => fetchOrderAndDelivery(activeOrderId)}
            title="Refresh tracking status"
            style={{
              padding: "7px 10px", borderRadius: 999, border: `1px solid ${INK_HAIR}`,
              background: CARD, color: INK_SOFT, cursor: "pointer", display: "flex", alignItems: "center"
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Hero Status Banner */}
      <div style={{
        background: `linear-gradient(135deg, #1A1814 0%, #2D2520 100%)`,
        borderRadius: 24, padding: "28px 32px", marginBottom: 24,
        position: "relative", overflow: "hidden", color: "#FFF",
        boxShadow: "0 10px 30px rgba(28,18,8,0.18)"
      }}>
        <div style={{
          position: "absolute", top: -50, right: -50, width: 220, height: 220,
          borderRadius: "50%", background: `${TC}18`, pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -40, right: 90, width: 180, height: 180,
          borderRadius: "50%", background: `${SAFFRON}14`, pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
            <span style={{ fontSize: "2.6rem" }}>{statusInfo.emoji}</span>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)", fontSize: "2rem",
                fontWeight: 500, color: "#FFF5E6", letterSpacing: "-0.02em",
                marginBottom: 4, lineHeight: 1.1
              }}>{statusInfo.title}</h1>
              <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.68)" }}>
                {statusInfo.subtitle}
              </p>
              {isDelivered && (
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "9px 20px", borderRadius: 999, border: "none",
                      background: `linear-gradient(135deg, ${SAFFRON}, ${TC})`,
                      color: "#FFF5E6", fontSize: "0.88rem", fontWeight: 700,
                      cursor: "pointer", boxShadow: `0 4px 16px ${TC}40`,
                      transition: "transform 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <Sparkles size={15} />
                    ⭐ Give Restaurant & Driver Review
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "9px 18px", borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.25)",
                      background: "rgba(255,255,255,0.12)",
                      color: "#FFF5E6", fontSize: "0.86rem", fontWeight: 700,
                      cursor: "pointer", transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                  >
                    🏠 Customer Home
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: "flex", gap: 24, marginTop: 18, paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.12)", flexWrap: "wrap"
          }}>
            <div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Order ID</div>
              <div style={{ fontSize: "0.92rem", color: "#FFF5E6", fontWeight: 700 }}>#{String(activeOrderId).slice(-8)}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Restaurant</div>
              <div style={{ fontSize: "0.92rem", color: "#FFF5E6", fontWeight: 700 }}>{order.restaurantName || "Restaurant"}</div>
            </div>
            {eta && (
              <div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Est. Arrival</div>
                <div style={{ fontSize: "0.92rem", color: TC_SOFT, fontWeight: 700 }}>{eta}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Amount</div>
              <div style={{ fontSize: "0.92rem", color: SAFFRON, fontWeight: 700 }}>₹{order.totalAmount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Timeline & Details | Right Column LIVE MAP */}
      <div className="track-grid" style={{ display: "grid", gridTemplateColumns: "1fr 440px", gap: 24 }}>
        
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Order Progress Stepper */}
          <div style={{
            background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
            padding: "26px 28px", boxShadow: "0 2px 10px rgba(28,18,8,0.03)"
          }}>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: "1.2rem",
              fontWeight: 500, color: INK, marginBottom: 22,
            }}>Live Order Progress</h2>

            {isCancelled ? (
              <div style={{
                background: "#FEF2F2", borderRadius: 14, padding: "18px 22px",
                display: "flex", alignItems: "center", gap: 14,
                border: "1px solid #FECACA",
              }}>
                <XCircle size={24} style={{ color: "#DC2626", flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, color: "#991B1B", marginBottom: 2 }}>Order cancelled</p>
                  <p style={{ fontSize: "0.82rem", color: "#DC2626" }}>
                    {order.cancellationReason || "Funds have been safely refunded to your wallet."}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ position: "relative", paddingLeft: 46 }}>
                {/* Vertical background timeline bar */}
                <div style={{
                  position: "absolute", left: 16, top: 12, bottom: 12,
                  width: 3, background: INK_HAIR, borderRadius: 2
                }} />
                {/* Active progress fill */}
                <div style={{
                  position: "absolute", left: 16, top: 12,
                  width: 3, zIndex: 1, borderRadius: 2,
                  height: isDelivered ? "100%" : `${Math.min(currentStepIndex / (STATUS_STEPS.length - 1), 1) * 100}%`,
                  background: isDelivered
                    ? SUCCESS
                    : `linear-gradient(180deg, ${TC_SOFT}, ${TC})`,
                  transition: "height 0.6s ease",
                }} />

                {STATUS_STEPS.map((step, index) => {
                  const isPassed  = isDelivered ? true : index < currentStepIndex;
                  const isCurrent = isDelivered ? false : index === currentStepIndex;
                  const isActive  = isDelivered ? true : index <= currentStepIndex;
                  const Icon      = step.icon;

                  return (
                    <div key={step.key} style={{
                      position: "relative",
                      marginBottom: index < STATUS_STEPS.length - 1 ? 26 : 0,
                      opacity: isActive ? 1 : 0.45,
                      transition: "opacity 0.3s",
                    }}>
                      {/* Step Circle */}
                      <div style={{
                        position: "absolute", left: -46, top: 0,
                        width: 34, height: 34, borderRadius: "50%",
                        background: isCurrent
                          ? `linear-gradient(135deg, ${TC_SOFT}, ${TC_DEEP})`
                          : isPassed
                            ? SUCCESS
                            : CARD,
                        border: `2px solid ${isActive ? (isCurrent ? TC : SUCCESS) : INK_HAIR}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 2,
                        boxShadow: isCurrent ? `0 0 0 5px ${TC}25` : "none",
                        transition: "all 0.3s",
                      }}>
                        <Icon size={15} style={{ color: isActive ? "#FFF5E6" : INK_MUTED }} />
                      </div>

                      {/* Step Text */}
                      <div>
                        <div style={{
                          fontSize: "0.95rem",
                          fontWeight: isCurrent ? 800 : isActive ? 700 : 500,
                          color: isCurrent ? TC_DEEP : isActive ? INK : INK_MUTED,
                          display: "flex", alignItems: "center", gap: 8
                        }}>
                          {step.key === "READY" && !hasDriverAssigned ? "Food Ready · Finding Rider" : step.label}
                          {isCurrent && (
                            <span style={{
                              padding: "2px 8px", borderRadius: 999,
                              background: `${TC}15`, color: TC,
                              fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.04em",
                              textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: TC, animation: "pulse 1.5s infinite" }} />
                              In Progress
                            </span>
                          )}
                          {isPassed && (
                            <span style={{ color: SUCCESS, fontSize: "0.75rem", fontWeight: 700 }}>✓ Done</span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: INK_SOFT, marginTop: 2 }}>
                          {step.key === "READY" && !hasDriverAssigned
                            ? "Kitchen finished cooking! Matching with nearest driver in area..."
                            : (step.key === "READY" && hasDriverAssigned && driverName
                                ? `${driverName} is on the way to pick up your order`
                                : step.desc)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delivery Address & Customer Details */}
          <div style={{
            background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
            padding: "22px 24px", boxShadow: "0 2px 10px rgba(28,18,8,0.03)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${SAFFRON}18`, display: "flex", alignItems: "center", justifyContent: "center", color: SAFFRON }}>
                  <MapPin size={18} />
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: INK, margin: 0 }}>Delivery Destination</h3>
              </div>
              {targetAddressObj?.label && (
                <span style={{ fontSize: "0.74rem", fontWeight: 700, background: `${TC}15`, color: TC, padding: "3px 10px", borderRadius: 999 }}>
                  {targetAddressObj.label === "HOME" ? "🏠 Home" : targetAddressObj.label === "WORK" ? "💼 Work" : "📍 Saved"}
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.92rem", color: INK, fontWeight: 600, marginBottom: 4, lineHeight: 1.5 }}>
              {displayAddress}
            </div>
            {targetAddressObj?.city && (
              <div style={{ fontSize: "0.78rem", color: INK_MUTED, marginTop: 4 }}>
                Selected Area: <strong>{targetAddressObj.city}</strong> (Direct delivery to your address)
              </div>
            )}
            {order.specialInstructions && (
              <div style={{ fontSize: "0.82rem", color: INK_MUTED, background: `${INK_HAIR}`, padding: "8px 12px", borderRadius: 8, marginTop: 8 }}>
                📌 Note for driver: {order.specialInstructions}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div style={{
            background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
            padding: "22px 24px", boxShadow: "0 2px 10px rgba(28,18,8,0.03)"
          }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: INK, marginBottom: 16 }}>Items in this order</h3>
            {order.items?.map((item, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: i < order.items.length - 1 ? `1px solid ${INK_HAIR}` : "none",
              }}>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: INK }}>
                    {item.quantity}x {item.name || item.menuItemName}
                  </div>
                  {item.isVeg !== undefined && (
                    <span style={{
                      fontSize: "0.7rem", color: item.isVeg ? SUCCESS : TC,
                      marginTop: 2, display: "inline-block", fontWeight: 600
                    }}>{item.isVeg ? "🟢 Pure Veg" : "🔺 Non-veg"}</span>
                  )}
                </div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: INK, fontFamily: "var(--font-display)" }}>
                  ₹{(item.price || item.unitPrice || 0) * (item.quantity || 1)}
                </div>
              </div>
            ))}

            <div style={{
              marginTop: 14, paddingTop: 14, borderTop: `2px solid ${INK_HAIR}`,
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: INK }}>Total Paid</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: TC, fontFamily: "var(--font-display)" }}>
                ₹{order.totalAmount}
              </span>
            </div>
          </div>

          {/* Cancellation Info & Action Card */}
          {canCancel && (
            <div style={{
              background: "#FFF", borderRadius: 20, border: "1.5px solid #FECACA",
              padding: "20px 24px", boxShadow: "0 2px 12px rgba(220,38,38,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 14
            }}>
              <div>
                <div style={{ fontWeight: 800, color: "#991B1B", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 7 }}>
                  <XCircle size={17} color="#DC2626" /> Cancel Order Option
                </div>
                <div style={{ fontSize: "0.8rem", color: INK_SOFT, marginTop: 4, maxWidth: 360, lineHeight: 1.45 }}>
                  You can cancel this order <strong>until the driver picks up food from the kitchen</strong>. The full amount will be credited back to your wallet instantly.
                </div>
              </div>
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={cancelling}
                style={{
                  padding: "10px 20px", borderRadius: 12,
                  border: "none", background: "#DC2626",
                  color: "#FFF", fontWeight: 700, fontSize: "0.88rem",
                  cursor: cancelling ? "wait" : "pointer",
                  display: "inline-flex", alignItems: "center", gap: 7,
                  boxShadow: "0 4px 14px rgba(220,38,38,0.3)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                {cancelling ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <XCircle size={15} />}
                Cancel Order
              </button>
            </div>
          )}

          {isDriverPickedUp && !isDelivered && !isCancelled && (
            <div style={{
              background: `${TC}0A`, borderRadius: 16, border: `1px solid ${TC}25`,
              padding: "14px 18px", display: "flex", alignItems: "center", gap: 10,
              fontSize: "0.82rem", color: TC_DEEP, fontWeight: 600
            }}>
              <Bike size={18} style={{ flexShrink: 0, color: TC }} />
              <span>Food has been picked up from the restaurant. Driver is en route to you, so cancellation is closed.</span>
            </div>
          )}
        </div>

        {/* Right Column: LIVE MAP & DRIVER INFORMATION */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          
          {/* Map Container - ALWAYS VISIBLE */}
          <div style={{
            background: CARD, borderRadius: 22, border: `1px solid ${INK_HAIR}`,
            overflow: "hidden", height: 420, position: "relative",
            boxShadow: "0 4px 20px rgba(28,18,8,0.08)"
          }}>
            <MapContainer
              key={`order-tracking-map-${activeOrderId}-${restaurantLocation[0].toFixed(3)}-${restaurantLocation[1].toFixed(3)}`}
              center={effectiveDriverLocation || restaurantLocation}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={navStart || restaurantLocation} dest={navDest || deliveryLocation} />

              {/* Restaurant Marker */}
              <Marker position={restaurantLocation} icon={restaurantIcon}>
                <Popup>
                  <strong>{order.restaurantName || "Restaurant"}</strong>
                  <br />Kitchen location
                </Popup>
              </Marker>

              {/* Driver Marker - ONLY SHOWN WHEN DRIVER IS GENUINELY ASSIGNED! */}
              {hasDriverAssigned && effectiveDriverLocation && !isDelivered && (
                <Marker position={effectiveDriverLocation} icon={driverIcon}>
                  <Popup>
                    <strong>{driverName || "Delivery Partner"}</strong>
                    <br />
                    {isDriverPickedUp ? "En route to your address 🛵" : "Heading to restaurant 🛵"}
                  </Popup>
                </Marker>
              )}

              {/* Customer Delivery Destination Marker */}
              <Marker position={deliveryLocation} icon={homeIcon}>
                <Popup>
                  <strong>Your Delivery Address</strong>
                  <br />{displayAddress}
                </Popup>
              </Marker>

              {/* Active Navigation Polyline */}
              {!isDelivered && hasDriverAssigned && activePolyline && activePolyline.length > 1 && (
                <>
                  {/* Soft Road Glow */}
                  <Polyline
                    positions={activePolyline}
                    color={routeMode === "fastest" ? "#3B82F6" : "#FBBF24"}
                    weight={9}
                    opacity={0.35}
                  />
                  {/* Solid Road Polyline */}
                  <Polyline
                    positions={activePolyline}
                    color={routeMode === "fastest" ? "#1D4ED8" : "#D97706"}
                    weight={5}
                    opacity={0.95}
                  />
                </>
              )}

              {/* Alternate Traffic Bypass Polyline (Dashed, Clickable) */}
              {!isDelivered && hasDriverAssigned && inactivePolyline && inactivePolyline.length > 1 && (
                <Polyline
                  positions={inactivePolyline}
                  color={routeMode === "fastest" ? "#F59E0B" : "#3B82F6"}
                  dashArray="6, 8"
                  weight={4}
                  opacity={0.75}
                  eventHandlers={{
                    click: () => setRouteMode(prev => prev === "fastest" ? "bypass" : "fastest")
                  }}
                >
                  <Popup>
                    <strong>{routeMode === "fastest" ? "🛣️ Alternate Shortcut (Avoid Traffic)" : "⚡ Fastest Highway Route"}</strong>
                    <br />Tap to switch route view
                  </Popup>
                </Polyline>
              )}
            </MapContainer>

            {/* Remaining Road Distance Floating Pill */}
            <div style={{
              position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 1000,
              background: "rgba(17, 24, 39, 0.92)", backdropFilter: "blur(10px)",
              color: "#FFF", padding: "10px 16px", borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: isDelivered ? SUCCESS : hasDriverAssigned ? "#3B82F6" : SAFFRON,
                  boxShadow: isDelivered ? `0 0 10px ${SUCCESS}` : hasDriverAssigned ? "0 0 10px #60A5FA" : `0 0 10px ${SAFFRON}`,
                  animation: isDelivered ? "none" : "pulse 1.5s infinite"
                }} />
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: isDelivered ? "#86EFAC" : hasDriverAssigned ? "#93C5FD" : "#FDE68A" }}>
                    {isDelivered
                      ? "Order Delivered Successfully 🎉"
                      : !hasDriverAssigned
                        ? (orderStatus === "READY" ? "Food Ready · Finding Delivery Partner" : "Kitchen Preparing Order 🍳")
                        : isDriverPickedUp
                          ? "Rider En Route to You"
                          : "Rider to Restaurant"}
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                    {isDelivered
                      ? "Food arrived at your address"
                      : !hasDriverAssigned
                        ? (orderStatus === "READY" ? `Matching nearest rider in ${targetCityName}...` : "Chef is freshly cooking your order")
                        : activeDistance > 0
                          ? <span>{activeDistance < 1 ? `${Math.round(activeDistance * 1000)} m` : `${activeDistance.toFixed(2)} km`} left on road · {routeMode === "fastest" ? "🟢 Low Traffic" : "🟡 Avoid Traffic"}</span>
                          : "Calculating live road route..."}
                    {!isDelivered && hasDriverAssigned && (alternateKm > 0 || remainingKm > 0) && (
                      <button
                        onClick={() => setRouteMode(prev => prev === "fastest" ? "bypass" : "fastest")}
                        style={{
                          background: routeMode === "fastest" ? "rgba(245, 158, 11, 0.22)" : "rgba(59, 130, 246, 0.22)",
                          color: routeMode === "fastest" ? "#FBBF24" : "#93C5FD",
                          border: routeMode === "fastest" ? "1px solid rgba(245, 158, 11, 0.45)" : "1px solid rgba(59, 130, 246, 0.45)",
                          padding: "2px 8px", borderRadius: 8, fontSize: "0.7rem", fontWeight: 700,
                          cursor: "pointer", transition: "all 0.15s"
                        }}
                      >
                        {routeMode === "fastest" ? "🛣️ Suggest Bypass" : "⚡ Fastest Route"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isDelivered ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    style={{
                      padding: "6px 14px", borderRadius: 999, border: "none",
                      background: `linear-gradient(135deg, ${SAFFRON}, ${TC})`,
                      color: "#FFF", fontSize: "0.8rem", fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
                    }}
                  >
                    <Star size={13} fill="#FFF" /> Give Review
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    style={{
                      padding: "6px 12px", borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.25)",
                      background: "rgba(255,255,255,0.15)",
                      color: "#FFF", fontSize: "0.8rem", fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    🏠 Home
                  </button>
                </div>
              ) : eta ? (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>ETA</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: SAFFRON }}>{eta}</div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Delivery Partner / Driver Details Card */}
          <div style={{
            background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
            padding: "22px 24px", boxShadow: "0 2px 10px rgba(28,18,8,0.03)"
          }}>
            <div style={{
              fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 14,
            }}>
              Delivery Partner Status
            </div>

            {driverName ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#FFF5E6", fontSize: "1.3rem", fontWeight: 700, flexShrink: 0,
                    boxShadow: `0 4px 12px ${TC}35`
                  }}>
                    {driverName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: INK }}>{driverName}</div>
                    <div style={{ fontSize: "0.78rem", color: INK_MUTED, marginTop: 2 }}>
                      Verified Delivery Partner · Hero Splendor
                    </div>
                  </div>
                </div>

                {driverPhone && (
                  <a href={`tel:${driverPhone}`} style={{
                    width: "100%", padding: "11px 16px", borderRadius: 12, border: "none",
                    background: `${TC}12`, color: TC_DEEP, cursor: "pointer",
                    fontFamily: "var(--font-sans)", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, fontSize: "0.9rem", textDecoration: "none",
                    transition: "all 0.2s"
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = `${TC}20`}
                    onMouseLeave={e => e.currentTarget.style.background = `${TC}12`}
                  >
                    <Phone size={15} /> Call Driver ({driverPhone})
                  </a>
                )}
              </div>
            ) : (
              <div style={{ padding: "12px 0", color: INK_SOFT, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 10 }}>
                <Clock size={18} style={{ color: TC }} />
                <span>Assigning nearest driver in {targetCityName} area...</span>
              </div>
            )}
          </div>

          {/* Restaurant Contact Card */}
          <div style={{
            background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
            padding: "20px 24px", boxShadow: "0 2px 10px rgba(28,18,8,0.03)",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: INK_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Preparing at
              </div>
              <div style={{ fontSize: "0.98rem", fontWeight: 700, color: INK, marginTop: 2 }}>
                {order.restaurantName || "Restaurant"}
              </div>
            </div>
            <button
              onClick={() => navigate(`/restaurants/${order.restaurantId}`)}
              style={{
                padding: "8px 14px", borderRadius: 999, border: `1px solid ${INK_HAIR}`,
                background: "#FFF", color: INK_SOFT, fontSize: "0.78rem", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5
              }}
            >
              View Menu <ChevronRight size={13} />
            </button>
          </div>

          {/* Cancellation status card / action */}
          {canCancel && (
            <div style={{
              background: "#FFF5F5", borderRadius: 20, border: "1px solid #FECACA",
              padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14
            }}>
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#991B1B" }}>
                  Need to cancel this order?
                </div>
                <div style={{ fontSize: "0.76rem", color: "#B91C1C", marginTop: 2 }}>
                  Allowed until rider picks up food from restaurant. Full refund to wallet.
                </div>
              </div>
              <button
                onClick={() => setShowCancelModal(true)}
                style={{
                  padding: "9px 18px", borderRadius: 999, border: "1px solid #DC2626",
                  background: "#DC2626", color: "#FFF", fontSize: "0.82rem", fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6,
                  boxShadow: "0 2px 8px rgba(220,38,38,0.25)", transition: "all 0.15s"
                }}
              >
                <XCircle size={14} /> Cancel Order
              </button>
            </div>
          )}

          {isDriverPickedUp && !isDelivered && !isCancelled && (
            <div style={{
              background: "#F8FAFC", borderRadius: 16, border: `1px solid ${INK_HAIR}`,
              padding: "14px 18px", display: "flex", alignItems: "center", gap: 10,
              fontSize: "0.8rem", color: INK_MUTED
            }}>
              <span style={{ fontSize: "1.1rem" }}>🛵</span>
              <span>Rider has collected your meal from the kitchen. Cancellation is locked.</span>
            </div>
          )}

          {isCancelled && (
            <div style={{
              background: "#FEF2F2", borderRadius: 16, border: "1px solid #FECACA",
              padding: "16px 20px", display: "flex", alignItems: "center", gap: 12
            }}>
              <XCircle size={22} style={{ color: "#DC2626", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: "#991B1B", fontSize: "0.9rem" }}>Order Cancelled</div>
                <div style={{ fontSize: "0.78rem", color: "#DC2626", marginTop: 2 }}>
                  Your refund has been safely returned to your MealMate wallet.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── BEAUTIFUL REVIEW & RATING POPUP MODAL ─── */}
      {showReviewModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(18, 12, 8, 0.72)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, overflowY: "auto", animation: "fade-in 0.25s ease-out"
        }}>
          <div style={{
            background: "#FFFBF2", borderRadius: 28, width: "100%", maxWidth: 640,
            boxShadow: "0 25px 60px rgba(0,0,0,0.35)", border: "1.5px solid rgba(192, 64, 30, 0.15)",
            overflow: "hidden", position: "relative",
            animation: "modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            
            {/* Modal Header */}
            <div style={{
              background: `linear-gradient(135deg, #1C1208 0%, #2F1E14 100%)`,
              padding: "22px 28px", color: "#FFF", position: "relative",
              borderBottom: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 10px", borderRadius: 999,
                    background: `${SUCCESS}25`, color: "#86EFAC",
                    fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                    marginBottom: 8
                  }}>
                    <CheckCircle size={13} /> Order Delivered
                  </div>
                  <h2 style={{
                    fontFamily: "var(--font-display)", fontSize: "1.55rem",
                    fontWeight: 600, color: "#FFF5E6", letterSpacing: "-0.01em", margin: 0
                  }}>
                    How was your experience?
                  </h2>
                  <p style={{ fontSize: "0.86rem", color: "rgba(255,255,255,0.7)", marginTop: 4, marginBottom: 0 }}>
                    Rate {order?.restaurantName || "Brother's Pizzariya"} & your delivery partner to help them keep up the quality!
                  </p>
                </div>
                <button
                  onClick={handleDismissModal}
                  title="Close modal"
                  style={{
                    background: "rgba(255,255,255,0.12)", border: "none", color: "#FFF",
                    width: 34, height: 34, borderRadius: "50%", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "background 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: "24px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* SECTION 1: RESTAURANT REVIEW */}
              <div style={{
                background: "#FFF", borderRadius: 20, padding: "20px 22px",
                border: "1px solid rgba(28,18,8,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: `${TC}15`, color: TC, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.2rem", fontWeight: 700
                  }}>
                    🍽️
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: TC, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Restaurant Review
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: INK }}>
                      {order?.restaurantName || "Brother's Pizzariya"}
                    </div>
                  </div>
                </div>

                {/* Stars selector */}
                <div style={{ textAlign: "center", margin: "14px 0" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 8 }}>
                    {[1, 2, 3, 4, 5].map((s) => {
                      const active = (restHoverRating || restRating) >= s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRestRating(s)}
                          onMouseEnter={() => setRestHoverRating(s)}
                          onMouseLeave={() => setRestHoverRating(0)}
                          style={{
                            background: "none", border: "none", cursor: "pointer", padding: 4,
                            transform: active ? "scale(1.15)" : "scale(1)",
                            transition: "transform 0.15s ease"
                          }}
                        >
                          <Star
                            size={34}
                            style={{
                              color: active ? "#F59E0B" : "rgba(28,18,8,0.2)",
                              fill: active ? "#F59E0B" : "transparent",
                              transition: "all 0.15s ease"
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: TC_DEEP }}>
                    {restRating === 5 && "⭐⭐⭐⭐⭐ Exceptional food & delicious taste!"}
                    {restRating === 4 && "⭐⭐⭐⭐ Great food, thoroughly enjoyed!"}
                    {restRating === 3 && "⭐⭐⭐ Average, satisfied basic expectations"}
                    {restRating === 2 && "⭐⭐ Below expectations, needs improvement"}
                    {restRating === 1 && "⭐ Disappointed with meal quality"}
                  </div>
                </div>

                {/* Restaurant compliment tags */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: INK_MUTED, marginBottom: 8, textTransform: "uppercase" }}>
                    What did you like the most?
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      "🍕 Super Delicious",
                      "♨️ Hot & Fresh",
                      "📦 Great Packaging",
                      "🍱 Generous Portions",
                      "⚡ Fast Prep",
                      "🌿 Fresh Ingredients"
                    ].map(tag => {
                      const isSel = restTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleRestTag(tag)}
                          style={{
                            padding: "6px 12px", borderRadius: 999, border: `1px solid ${isSel ? TC : INK_HAIR}`,
                            background: isSel ? `${TC}15` : CARD,
                            color: isSel ? TC_DEEP : INK_SOFT,
                            fontSize: "0.78rem", fontWeight: isSel ? 700 : 500,
                            cursor: "pointer", transition: "all 0.15s"
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment textarea */}
                <div style={{ marginTop: 14 }}>
                  <textarea
                    rows={2}
                    value={restComment}
                    onChange={e => setRestComment(e.target.value)}
                    placeholder="Tell us what you liked about the taste, packaging or freshness (optional)..."
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 12,
                      border: `1px solid ${INK_HAIR}`, background: "#FAFAFA",
                      fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: INK,
                      resize: "none", boxSizing: "border-box", outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* SECTION 2: DELIVERY PARTNER REVIEW */}
              <div style={{
                background: "#FFF", borderRadius: 20, padding: "20px 22px",
                border: "1px solid rgba(28,18,8,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: `${SUCCESS}15`, color: SUCCESS, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.2rem", fontWeight: 700
                  }}>
                    🛵
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: SUCCESS, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Delivery Partner Rating
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: INK }}>
                      {driverName || "Dhruhit (Verified Rider)"}
                    </div>
                  </div>
                </div>

                {/* Stars selector */}
                <div style={{ textAlign: "center", margin: "14px 0" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 8 }}>
                    {[1, 2, 3, 4, 5].map((s) => {
                      const active = (driverHoverRating || driverRating) >= s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setDriverRating(s)}
                          onMouseEnter={() => setDriverHoverRating(s)}
                          onMouseLeave={() => setDriverHoverRating(0)}
                          style={{
                            background: "none", border: "none", cursor: "pointer", padding: 4,
                            transform: active ? "scale(1.15)" : "scale(1)",
                            transition: "transform 0.15s ease"
                          }}
                        >
                          <Star
                            size={34}
                            style={{
                              color: active ? SUCCESS : "rgba(28,18,8,0.2)",
                              fill: active ? SUCCESS : "transparent",
                              transition: "all 0.15s ease"
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: SUCCESS }}>
                    {driverRating === 5 && "⭐⭐⭐⭐⭐ Lightning fast & very courteous!"}
                    {driverRating === 4 && "⭐⭐⭐⭐ Good & polite delivery"}
                    {driverRating === 3 && "⭐⭐⭐ Delivered safely on time"}
                    {driverRating === 2 && "⭐⭐ Took longer than anticipated"}
                    {driverRating === 1 && "⭐ Poor delivery service"}
                  </div>
                </div>

                {/* Driver compliment tags */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: INK_MUTED, marginBottom: 8, textTransform: "uppercase" }}>
                    Compliments for rider
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      "⚡ Lightning Fast",
                      "😊 Polite & Courteous",
                      "🛍️ Handled With Care",
                      "📍 Followed Instructions",
                      "📞 Good Communication",
                      "🧼 Hygienic & Clean"
                    ].map(tag => {
                      const isSel = driverTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleDriverTag(tag)}
                          style={{
                            padding: "6px 12px", borderRadius: 999, border: `1px solid ${isSel ? SUCCESS : INK_HAIR}`,
                            background: isSel ? `${SUCCESS}15` : CARD,
                            color: isSel ? SUCCESS : INK_SOFT,
                            fontSize: "0.78rem", fontWeight: isSel ? 700 : 500,
                            cursor: "pointer", transition: "all 0.15s"
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Driver Comment textarea */}
                <div style={{ marginTop: 14 }}>
                  <textarea
                    rows={2}
                    value={driverComment}
                    onChange={e => setDriverComment(e.target.value)}
                    placeholder="Add a friendly note for your rider (optional)..."
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 12,
                      border: `1px solid ${INK_HAIR}`, background: "#FAFAFA",
                      fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: INK,
                      resize: "none", boxSizing: "border-box", outline: "none"
                    }}
                  />
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: "18px 28px", background: CARD, borderTop: `1px solid ${INK_HAIR}`,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14
            }}>
              <button
                type="button"
                onClick={handleDismissModal}
                style={{
                  padding: "11px 20px", borderRadius: 999, border: `1px solid ${INK_HAIR}`,
                  background: "transparent", color: INK_MUTED, fontSize: "0.85rem",
                  fontFamily: "var(--font-sans)", fontWeight: 600, cursor: "pointer"
                }}
              >
                Skip & Go to Home
              </button>

              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={submittingReview}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 28px", borderRadius: 999, border: "none",
                  background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
                  color: "#FFF5E6", fontSize: "0.92rem", fontWeight: 700,
                  fontFamily: "var(--font-sans)", cursor: submittingReview ? "not-allowed" : "pointer",
                  boxShadow: `0 6px 20px ${TC}40`, opacity: submittingReview ? 0.7 : 1
                }}
              >
                {submittingReview ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Submitting & Redirecting...
                  </>
                ) : (
                  <>
                    <Send size={15} /> Submit Review & Go to Home ⭐
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div onClick={() => setShowCancelModal(false)} style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(28,18,8,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#FFF", borderRadius: 22, padding: "30px 28px",
            maxWidth: 420, width: "100%", border: `1.5px solid ${INK_HAIR}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            animation: "modal-pop 0.2s ease-out"
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: "50%",
              background: "#FEE2E2", color: "#DC2626",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <XCircle size={26} />
            </div>
            <h3 style={{
              fontFamily: "var(--font-display)", fontSize: "1.35rem",
              fontWeight: 600, color: INK, textAlign: "center", marginBottom: 8
            }}>
              Cancel this order?
            </h3>
            <p style={{
              fontSize: "0.88rem", color: INK_SOFT, textAlign: "center",
              lineHeight: 1.5, marginBottom: 22
            }}>
              Your delivery partner has not yet picked up the food from the restaurant kitchen. You will receive an immediate full refund to your MealMate wallet.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12,
                  border: `1px solid ${INK_HAIR}`, background: CARD,
                  color: INK_SOFT, fontWeight: 600, fontSize: "0.88rem",
                  cursor: "pointer"
                }}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12,
                  border: "none", background: "#DC2626",
                  color: "#FFF", fontWeight: 700, fontSize: "0.88rem",
                  cursor: cancelling ? "wait" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: "0 4px 14px rgba(220,38,38,0.3)"
                }}
              >
                {cancelling ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes modal-pop { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 860px) {
          .track-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
