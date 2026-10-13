import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import toast from "react-hot-toast";
import {
  Navigation, Package, CheckCircle, XCircle, Loader2, Wifi, WifiOff,
  MapPin, Clock, Truck, Phone, MessageSquare, ExternalLink, Building,
  ShoppingBag, Copy, Check, ChevronDown, ChevronUp, Pencil
} from "lucide-react";
import { useDriverStore } from "../../store/driverStore";
import { useAuthStore } from "../../store/authStore";
import socketService from "../../services/socketService";
import api from "../../api/axios";

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
const INK_MUTED = "rgba(28,18,8,0.45)";
const INK_HAIR = "rgba(28,18,8,0.08)";
const CARD = "#FFF9EE";
const FIELD = "#F5ECD8";

const driverIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Ccircle cx='22' cy='22' r='20' fill='%2315803D' stroke='white' stroke-width='3'/%3E%3Ctext x='22' y='28' text-anchor='middle' font-size='20'%3E🛵%3C/text%3E%3C/svg%3E",
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

const restIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Ccircle cx='22' cy='22' r='20' fill='%23C0401E' stroke='white' stroke-width='3'/%3E%3Ctext x='22' y='28' text-anchor='middle' font-size='20'%3E🍽%3C/text%3E%3C/svg%3E",
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

const DELIVERY_STEPS = [
  { key: "DRIVER_ASSIGNED", label: "To Restaurant", emoji: "🛵", title: "Delivery Boy to Restaurant", desc: "Rider on the way to restaurant" },
  { key: "PICKED_UP", label: "Picked Up", emoji: "🛍️", title: "Delivered to Restaurant / Picked Up", desc: "Food collected from restaurant" },
  { key: "DELIVERED", label: "Delivered", emoji: "✅", title: "Delivered to Customer", desc: "Order delivered to customer" },
];

// Calculate Haversine distance in km between two [lat, lng] points
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
            // fallback if bypass fetch fails
          }
        }

        return { primary, alternate };
      }
    }
  } catch (err) {
    console.warn("OSRM road route fetch fallback:", err);
  }

  // Realistic curved road waypoints fallback
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

// Slice completed road route so completed distance is removed as rider moves forward
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

  // Keep remaining waypoints from closestIdx onwards, starting from rider's current position
  const remaining = fullRoute.slice(closestIdx);
  return [currentPos, ...remaining];
}

// Calculate remaining total distance along the polyline in km
function calculatePolylineDistanceKm(pts) {
  if (!pts || pts.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += getDistanceKm(pts[i], pts[i + 1]);
  }
  return total;
}

function MapFlyTo({ pos, target }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map]);

  useEffect(() => {
    if (pos && target && Array.isArray(pos) && Array.isArray(target) && !isNaN(pos[0]) && !isNaN(target[0])) {
      try {
        const bounds = L.latLngBounds([pos, target]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } catch {
        map.flyTo(pos, 15, { animate: true, duration: 1 });
      }
    } else if (pos && pos[0] && pos[1] && !isNaN(pos[0]) && !isNaN(pos[1])) {
      map.flyTo(pos, 15, { animate: true, duration: 1 });
    }
  }, [pos?.[0], pos?.[1], target?.[0], target?.[1], map]);
  return null;
}

export default function DriverHome() {
  const { user } = useAuthStore();
  const {
    driverProfile, activeDelivery, isOnline, currentLocation,
    fetchProfile, goOnline, goOffline,
    startLocationTracking, stopLocationTracking,
    fetchActiveDelivery, acceptDelivery, confirmPickup, declineDelivery, completeDelivery, registerDriver, updateProfile,
  } = useDriverStore();

  const [toggling, setToggling] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [mapCenter, setMapCenter] = useState([23.1644, 72.5909]); // Adalaj / Balapir default
  const [orderDetails, setOrderDetails] = useState(null);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedRestAddr, setCopiedRestAddr] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [routeMode, setRouteMode] = useState("fastest"); // "fastest" | "bypass"
  const [roadRoute, setRoadRoute] = useState([]);
  const [remainingRoadRoute, setRemainingRoadRoute] = useState([]);
  const [remainingKm, setRemainingKm] = useState(0);

  const [alternateRoadRoute, setAlternateRoadRoute] = useState([]);
  const [remainingAlternateRoute, setRemainingAlternateRoute] = useState([]);
  const [alternateKm, setAlternateKm] = useState(0);
  const [restaurantDetails, setRestaurantDetails] = useState(null);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", phone: "", vehicleNumber: "", vehicleType: "MOTORCYCLE"
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [countdown, setCountdown] = useState(25);

  const locTimer = useRef(null);
  const prevDeliveryId = useRef(null);
  const routeTargetKey = useRef("");

  // Fetch profile + active delivery on mount
  useEffect(() => {
    fetchProfile().then((p) => {
      if (p?.currentLatitude && p?.currentLongitude) {
        setMapCenter([parseFloat(p.currentLatitude), parseFloat(p.currentLongitude)]);
      }
    }).catch(() => { });
    fetchActiveDelivery().catch(() => { });
  }, []);

  // Poll for active delivery every 3s when online
  useEffect(() => {
    if (!isOnline || !driverProfile) return;
    const t = setInterval(() => {
      fetchActiveDelivery().then((delivery) => {
        if (delivery?.deliveryId && delivery.deliveryId !== prevDeliveryId.current) {
          prevDeliveryId.current = delivery.deliveryId;
          if (delivery.status === "PENDING") {
            toast("🔔 Incoming Delivery Request! Tap Accept or Decline below.", { icon: "🛵", duration: 7000 });
          } else {
            toast.success("🔔 Active delivery loaded! Check details below.", { duration: 6000 });
          }
        }
      });
    }, 3000);
    return () => clearInterval(t);
  }, [isOnline, driverProfile?.driverId]);

  useEffect(() => {
    if (activeDelivery?.deliveryId) prevDeliveryId.current = activeDelivery.deliveryId;
  }, [activeDelivery?.deliveryId]);

  useEffect(() => {
    if (driverProfile) {
      setEditForm({
        name: driverProfile.name || "",
        phone: driverProfile.phone || "",
        vehicleNumber: driverProfile.vehicleNumber || "",
        vehicleType: driverProfile.vehicleType || "MOTORCYCLE"
      });
    }
  }, [driverProfile]);

  // Fetch full order details (items, customer details, instructions) when delivery is active
  useEffect(() => {
    if (activeDelivery?.orderId) {
      api.get(`/orders/${activeDelivery.orderId}`)
        .then((res) => setOrderDetails(res.data))
        .catch(() => {});
    } else {
      setOrderDetails(null);
    }
  }, [activeDelivery?.orderId]);

  // Fetch live restaurant details (exact address, live GPS coordinates, contact)
  useEffect(() => {
    const rId = activeDelivery?.restaurantId || orderDetails?.restaurantId;
    if (rId) {
      api.get(`/restaurants/${rId}`)
        .then((res) => setRestaurantDetails(res.data))
        .catch(() => {});
    } else {
      setRestaurantDetails(null);
    }
  }, [activeDelivery?.restaurantId, orderDetails?.restaurantId]);

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

  // WebSocket subscription for assignments
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

  // Stream location updates to Kafka via WebSocket & REST
  useEffect(() => {
    if (!isOnline || !currentLocation || !activeDelivery) return;
    const send = () => {
      const lat = currentLocation.latitude;
      const lng = currentLocation.longitude;
      // Auto-resolve region
      const region = (lat >= 23.12 && lat <= 23.35 && lng >= 72.54 && lng <= 72.75) ? "gandhinagar" : "ahmedabad";
      
      socketService.sendDriverLocation(
        activeDelivery.orderId, driverProfile?.driverId,
        lat, lng, region
      );

      // Also sync via REST endpoint (producing to Kafka partition)
      api.post("/driver/location", {
        driverId: driverProfile?.driverId,
        orderId: activeDelivery.orderId,
        latitude: lat,
        longitude: lng,
        region,
        timestamp: Date.now()
      }).catch(() => {});
    };
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
            () => res({ coords: { latitude: 23.1644, longitude: 72.5855 } }),
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
    const rName = activeDelivery?.restaurantName || "the restaurant";
    if (!window.confirm(`Confirm Pickup: Have you collected the order items from ${rName}?`)) return;
    setActionBusy(true);
    try {
      await confirmPickup();
      toast.success("Order picked up from restaurant! Navigate to customer 🏠");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to confirm pickup");
    }
    setActionBusy(false);
  };

  const handleAccept = async () => {
    setActionBusy(true);
    try {
      await acceptDelivery();
      toast.success("Order request accepted! Head to the restaurant to collect food 🛵", { duration: 5000 });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to accept order");
    }
    setActionBusy(false);
  };

  const handleDecline = async (isAutoTimeout = false) => {
    if (!isAutoTimeout && !window.confirm("Decline this delivery request? It will be offered to the next available rider in the queue.")) return;
    setActionBusy(true);
    try {
      await declineDelivery();
      if (isAutoTimeout) {
        toast("⏰ Request timed out (25s). Passed to next rider in queue.", { icon: "⏳", duration: 4000 });
      } else {
        toast.success("Order declined. Passed to next rider in queue.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to decline delivery");
    }
    setActionBusy(false);
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    if (!editForm.name.trim() || !editForm.phone.trim() || !editForm.vehicleNumber.trim()) {
      return toast.error("Please enter Name, Phone, and Vehicle Number");
    }
    setUpdatingProfile(true);
    try {
      await updateProfile(editForm);
      toast.success("Rider profile updated! 🎉");
      setShowEditProfile(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    }
    setUpdatingProfile(false);
  };

  const handleComplete = async () => {
    const cName = activeDelivery?.userName || "the customer";
    if (!window.confirm(`Confirm Delivery: Have you safely delivered the food order to ${cName}?`)) return;
    setActionBusy(true);
    try {
      await completeDelivery();
      toast.success("Delivery completed successfully! Great job 🎉");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to complete delivery");
    }
    setActionBusy(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(true);
    toast.success("Address copied to clipboard!");
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const copyRestAddress = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedRestAddr(true);
    toast.success("Restaurant address copied!");
    setTimeout(() => setCopiedRestAddr(false), 2000);
  };

  // Base coordinates localized to Adalaj / Gandhinagar
  const AHM_DEFAULT = [23.1644, 72.5909];
  const locPos = currentLocation ? [currentLocation.latitude, currentLocation.longitude] : null;
  const anchorLat = locPos ? locPos[0] : AHM_DEFAULT[0];
  const anchorLng = locPos ? locPos[1] : AHM_DEFAULT[1];

  // Helper to reject outdated Bhopal coordinates
  const isBhopal = (lat, lng) => lat && lng && Math.abs(lat - 23.2599) < 0.2 && Math.abs(lng - 77.4126) < 0.2;

  // Real coordinate anchors: Balapir (Adalaj) & Shree Annapurna Dham (Adalaj)
  const BALAPIR_REST   = [23.1644, 72.5855]; // Balapir, Adalaj
  const ANNAPURNA_CUST = [23.16469190, 72.58210460]; // Shree Annapurna Dham, Adalaj
  const NIRMA_CUST     = [23.12639030, 72.54000890]; // Nirma University / SG Highway

  // Pickup location (Restaurant) - localized to Mc Donals (Kudasan) from restaurantDetails / activeDelivery
  const pickPos = (() => {
    if (restaurantDetails?.latitude && restaurantDetails?.longitude) {
      const lat = parseFloat(restaurantDetails.latitude);
      const lng = parseFloat(restaurantDetails.longitude);
      if (!isBhopal(lat, lng) && !isNaN(lat) && !isNaN(lng) && lat > 18 && lat < 28) {
        return [lat, lng];
      }
    }
    if (activeDelivery?.pickupLatitude && activeDelivery?.pickupLongitude) {
      const lat = parseFloat(activeDelivery.pickupLatitude);
      const lng = parseFloat(activeDelivery.pickupLongitude);
      if (!isBhopal(lat, lng) && !isNaN(lat) && !isNaN(lng) && lat > 18 && lat < 28) {
        return [lat, lng];
      }
    }
    return [23.16873855, 72.61295563]; // Mc Donals, Kudasan fallback
  })();

  // Dropoff location (Customer) - localized to selected address (Shree Annapurna Dham)
  const custPos = (() => {
    if (activeDelivery?.dropoffLatitude && activeDelivery?.dropoffLongitude) {
      const lat = parseFloat(activeDelivery.dropoffLatitude);
      const lng = parseFloat(activeDelivery.dropoffLongitude);
      if (!isBhopal(lat, lng) && !isNaN(lat) && !isNaN(lng) && lat > 18 && lat < 28) {
        return [lat, lng];
      }
    }
    const addr = (activeDelivery?.dropoffAddress || activeDelivery?.deliveryAddress || "").toLowerCase();
    if (addr.includes("annpurna") || addr.includes("annapurna") || addr.includes("adalaj")) {
      return ANNAPURNA_CUST;
    }
    if (addr.includes("nirma") || addr.includes("tragad") || addr.includes("sg highway")) {
      return NIRMA_CUST;
    }
    return ANNAPURNA_CUST;
  })();

  const dStatus = activeDelivery?.status || "";
  const isPendingOffer = dStatus === "PENDING";
  const isPickedUp = dStatus === "PICKED_UP" || dStatus === "IN_TRANSIT";
  const currentStep = DELIVERY_STEPS.findIndex(s => s.key === dStatus);
  const currentNavTarget = isPickedUp ? custPos : pickPos;

  // Uber-style 25s auto-timeout countdown for pending order offers
  useEffect(() => {
    if (!isPendingOffer) return;
    setCountdown(25);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleDecline(true); // auto timeout pass to next driver
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeDelivery?.deliveryId, isPendingOffer]);

  // Road Routing effect (Multi-route with traffic detour awareness)
  useEffect(() => {
    if (!activeDelivery || !locPos || !currentNavTarget) {
      setRoadRoute([]);
      setRemainingRoadRoute([]);
      setRemainingKm(0);
      setAlternateRoadRoute([]);
      setRemainingAlternateRoute([]);
      setAlternateKm(0);
      return;
    }

    const targetKey = `${isPickedUp ? "CUST" : "REST"}_${currentNavTarget[0].toFixed(4)}_${currentNavTarget[1].toFixed(4)}`;

    if (routeTargetKey.current !== targetKey || roadRoute.length === 0) {
      routeTargetKey.current = targetKey;
      setRoadRoute([]);
      setRemainingRoadRoute([]);
      setAlternateRoadRoute([]);
      setRemainingAlternateRoute([]);
      fetchRoadRoutes(locPos, currentNavTarget).then((routes) => {
        if (!routes?.primary || routes.primary.length === 0) return;
        setRoadRoute(routes.primary);
        const slicedPrimary = sliceCompletedRoadRoute(routes.primary, locPos);
        setRemainingRoadRoute(slicedPrimary);
        setRemainingKm(calculatePolylineDistanceKm(slicedPrimary));

        if (routes.alternate && routes.alternate.length > 0) {
          setAlternateRoadRoute(routes.alternate);
          const slicedAlt = sliceCompletedRoadRoute(routes.alternate, locPos);
          setRemainingAlternateRoute(slicedAlt);
          setAlternateKm(calculatePolylineDistanceKm(slicedAlt));
        } else {
          setAlternateRoadRoute([]);
          setRemainingAlternateRoute([]);
          setAlternateKm(0);
        }
      });
    } else {
      // Rider moved forward: slice off completed distance behind rider
      const slicedPrimary = sliceCompletedRoadRoute(roadRoute, locPos);
      setRemainingRoadRoute(slicedPrimary);
      setRemainingKm(calculatePolylineDistanceKm(slicedPrimary));

      if (alternateRoadRoute.length > 0) {
        const slicedAlt = sliceCompletedRoadRoute(alternateRoadRoute, locPos);
        setRemainingAlternateRoute(slicedAlt);
        setAlternateKm(calculatePolylineDistanceKm(slicedAlt));
      }
    }
  }, [
    activeDelivery?.deliveryId,
    isPickedUp,
    locPos?.[0],
    locPos?.[1],
    currentNavTarget?.[0],
    currentNavTarget?.[1]
  ]);

  const activePolyline = routeMode === "fastest" ? remainingRoadRoute : (remainingAlternateRoute.length > 0 ? remainingAlternateRoute : remainingRoadRoute);
  const inactivePolyline = routeMode === "fastest" ? remainingAlternateRoute : remainingRoadRoute;
  const activeDistance = routeMode === "fastest" ? remainingKm : (alternateKm > 0 ? alternateKm : remainingKm);

  // Customer contact info (from delivery-service or order-service)
  const customerName = activeDelivery?.userName || orderDetails?.userName || "Dhurhit";
  const customerPhone = activeDelivery?.userPhone || orderDetails?.userPhone || orderDetails?.phone || "9974531106";
  const rawCustomerAddress = activeDelivery?.dropoffAddress || activeDelivery?.deliveryAddress || orderDetails?.deliveryAddress || "Shree annupurna dham, Adalaj, 382421";
  const customerAddress = rawCustomerAddress.replace(/^\[.*?\]\s*/, "");
  const isHostel = customerAddress.toLowerCase().includes("hostel");

  // Restaurant contact info (always matching live restaurant record)
  const restaurantName = restaurantDetails?.name || activeDelivery?.restaurantName || orderDetails?.restaurantName || "Mc Donals";
  const restaurantAddress = restaurantDetails?.address || activeDelivery?.pickupAddress || activeDelivery?.restaurantAddress || "Kudasan, Adalaj, Gandhinagar Taluka, Gandhinagar, Gujarat, 382421, India";
  const restaurantPhone = restaurantDetails?.phone || activeDelivery?.restaurantPhone || "9408534410";

  // Navigation target in Google Maps
  const navTarget = isPickedUp ? custPos : pickPos;
  const navUrl = navTarget
    ? `https://www.google.com/maps/dir/?api=1&destination=${navTarget[0]},${navTarget[1]}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(isPickedUp ? customerAddress : restaurantAddress)}`;

  // Show registration screen if driver profile not setup
  if (!driverProfile) return <RegisterScreen user={user} onSuccess={async () => { await fetchProfile(); }} />;

  return (
    <div style={{ paddingBottom: 40, color: INK, maxWidth: 680, margin: "0 auto" }}>
      {/* ─── Top Header (Zomato Rider Style) ─── */}
      <div style={{
        padding: "16px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", background: "#FFF",
        borderBottom: `1px solid ${INK_HAIR}`, position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, background: isOnline ? `${SUCCESS}15` : `${TC}15`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem"
          }}>🛵</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: INK, letterSpacing: "-0.01em" }}>
                {driverProfile?.name || "Rider"}
              </div>
              <button
                onClick={() => setShowEditProfile(true)}
                style={{
                  background: "rgba(192,64,30,0.08)", border: "none", borderRadius: 6,
                  padding: "3px 8px", fontSize: "0.68rem", fontWeight: 700, color: TC,
                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3,
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(192,64,30,0.16)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(192,64,30,0.08)"}
                title="Edit Rider Details"
              >
                <Pencil size={11} /> Edit Details
              </button>
            </div>
            <div style={{ fontSize: "0.72rem", color: INK_MUTED, fontWeight: 600, marginTop: 2 }}>
              {driverProfile?.vehicleType || "MOTORCYCLE"} · {driverProfile?.vehicleNumber || "Active"} {driverProfile?.phone ? `· ${driverProfile.phone}` : ""}
            </div>
          </div>
        </div>

        {/* Online / Offline Toggle Button */}
        <button onClick={handleToggle} disabled={toggling} style={{
          padding: "8px 16px", borderRadius: 999, border: "none",
          background: isOnline ? "#15803D" : "#374151",
          color: "#FFF", fontWeight: 700, fontSize: "0.82rem",
          cursor: toggling ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
          boxShadow: isOnline ? "0 4px 14px rgba(21,128,61,0.35)" : "none",
          transition: "all 0.2s"
        }}>
          {toggling
            ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            : <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: isOnline ? "#4ADE80" : "#9CA3AF"
              }} />}
          {isOnline ? "ONLINE" : "OFFLINE"}
        </button>
      </div>

      {/* ─── Zomato-Style Live Map (Hero Placement at Top) ─── */}
      <div style={{
        margin: "14px 16px 0", borderRadius: 20, overflow: "hidden",
        border: `1.5px solid ${INK_HAIR}`, height: 320, position: "relative",
        boxShadow: "0 8px 30px rgba(0,0,0,0.08)"
      }}>
        <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <MapFlyTo pos={locPos || (activeDelivery ? pickPos : mapCenter)} target={currentNavTarget} />

          {/* Rider Marker */}
          {locPos && (
            <Marker position={locPos} icon={driverIcon}>
              <Popup><b>🛵 Your Location</b><br />Heading to {isPickedUp ? "Customer" : "Restaurant"}</Popup>
            </Marker>
          )}

          {/* Restaurant Marker (When active delivery) */}
          {activeDelivery && pickPos && (
            <Marker position={pickPos} icon={restIcon}>
              <Popup><b>🍽 {activeDelivery.restaurantName || "Restaurant"}</b><br />Pickup Location</Popup>
            </Marker>
          )}

          {/* Customer Drop-off Marker (When active delivery) */}
          {activeDelivery && custPos && (
            <Marker position={custPos} icon={homeIcon}>
              <Popup><b>🏠 {isHostel ? "Hostel Delivery" : "Customer Location"}</b><br />{customerAddress}</Popup>
            </Marker>
          )}

          {/* Active Navigation Polyline */}
          {activePolyline && activePolyline.length > 1 && (
            <>
              {/* Soft outer glow */}
              <Polyline
                positions={activePolyline}
                color={routeMode === "fastest" ? "#3B82F6" : "#FBBF24"}
                weight={8}
                opacity={0.35}
              />
              {/* Vibrant solid road polyline */}
              <Polyline
                positions={activePolyline}
                color={routeMode === "fastest" ? "#1D4ED8" : "#D97706"}
                weight={5}
                opacity={0.95}
              />
            </>
          )}

          {/* Alternate Bypass Polyline (Dashed, Clickable to Switch Route) */}
          {inactivePolyline && inactivePolyline.length > 1 && (
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
                <b>{routeMode === "fastest" ? "🛣️ Bypass Shortcut (Avoid Congestion)" : "⚡ Fastest Highway Route"}</b>
                <br />Click to switch active route
              </Popup>
            </Polyline>
          )}
        </MapContainer>

        {/* Floating Remaining Road Distance & Route Mode Pill */}
        {activeDelivery && activeDistance > 0 && (
          <div style={{
            position: "absolute", top: 12, left: 12, zIndex: 1000,
            background: "rgba(17, 24, 39, 0.92)", backdropFilter: "blur(8px)",
            color: "#FFF", padding: "8px 14px", borderRadius: 14,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.15)"
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: routeMode === "fastest" ? "#3B82F6" : "#F59E0B",
              boxShadow: routeMode === "fastest" ? "0 0 8px #60A5FA" : "0 0 8px #FBBF24"
            }} />
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: routeMode === "fastest" ? "#93C5FD" : "#FDE68A", fontWeight: 700 }}>
                {isPickedUp ? "TO CUSTOMER" : "TO RESTAURANT"} · {routeMode === "fastest" ? "⚡ FASTEST" : "🛣️ BYPASS"}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800 }}>
                {activeDistance < 1 ? `${Math.round(activeDistance * 1000)} m` : `${activeDistance.toFixed(2)} km`} left
              </div>
            </div>
          </div>
        )}

        {/* Floating Google Maps Navigation Button */}
        {activeDelivery && (
          <a href={navUrl} target="_blank" rel="noopener noreferrer" style={{
            position: "absolute", top: 12, right: 12, zIndex: 1000,
            background: "#1E3A8A", color: "#FFF", padding: "9px 14px",
            borderRadius: 12, fontSize: "0.8rem", fontWeight: 700,
            textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 4px 16px rgba(30,58,138,0.45)"
          }}>
            <Navigation size={15} /> Open Google Maps
          </a>
        )}

        {/* Route Selector Controls (Smart Traffic Suggestion Pill) */}
        {activeDelivery && (remainingKm > 0 || alternateKm > 0) && (
          <div style={{
            position: "absolute", bottom: 12, left: 12, right: 12, zIndex: 1000,
            display: "flex", gap: 8
          }}>
            <button
              onClick={() => setRouteMode("fastest")}
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 12,
                background: routeMode === "fastest" ? "rgba(29, 78, 216, 0.95)" : "rgba(17, 24, 39, 0.85)",
                backdropFilter: "blur(8px)", color: "#FFF",
                border: routeMode === "fastest" ? "1.5px solid #60A5FA" : "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)", transition: "all 0.15s"
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, color: routeMode === "fastest" ? "#93C5FD" : "#94A3B8" }}>
                  ⚡ FASTEST WAY
                </div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800 }}>
                  {remainingKm > 0 ? `${remainingKm.toFixed(2)} km` : "Main Route"}
                </div>
              </div>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, background: "rgba(34,197,94,0.25)", color: "#4ADE80", padding: "2px 6px", borderRadius: 6 }}>
                🟢 Low Traffic
              </span>
            </button>

            <button
              onClick={() => setRouteMode("bypass")}
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 12,
                background: routeMode === "bypass" ? "rgba(217, 119, 6, 0.95)" : "rgba(17, 24, 39, 0.85)",
                backdropFilter: "blur(8px)", color: "#FFF",
                border: routeMode === "bypass" ? "1.5px solid #FBBF24" : "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)", transition: "all 0.15s"
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, color: routeMode === "bypass" ? "#FDE68A" : "#94A3B8" }}>
                  🛣️ BYPASS SHORTCUT
                </div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800 }}>
                  {alternateKm > 0 ? `${alternateKm.toFixed(2)} km` : "Bypass Road"}
                </div>
              </div>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, background: "rgba(234,179,8,0.25)", color: "#FBBF24", padding: "2px 6px", borderRadius: 6 }}>
                🟡 Avoid Jam
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Active Delivery Card / Incoming Offer Card ─── */}
      {activeDelivery ? (
        isPendingOffer ? (
          /* ─── INCOMING DELIVERY OFFER SCREEN (Accept / Decline Queue) ─── */
          <div style={{ margin: "16px 16px 0", animation: "slide-up 0.3s ease-out" }}>
            <div style={{
              background: "#FFF", borderRadius: 24, border: `2px solid ${SAFFRON}`,
              overflow: "hidden", boxShadow: `0 12px 36px ${SAFFRON}25`
            }}>
              {/* Alert Banner */}
              <div style={{
                background: `linear-gradient(135deg, ${SAFFRON} 0%, ${TC} 100%)`,
                color: "#FFF", padding: "18px 20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{
                      fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: "rgba(255,255,255,0.22)", padding: "4px 12px", borderRadius: 999, marginBottom: 6
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFF", animation: "pulse 1s infinite" }} />
                      🔔 NEW ORDER REQUEST RECEIVED
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", fontWeight: 800 }}>
                      Order #{(activeDelivery.orderId || "").slice(-6).toUpperCase()}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      background: "#FFF", color: TC,
                      padding: "6px 14px", borderRadius: 999, fontSize: "0.95rem", fontWeight: 900,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                    }}>
                      ₹{activeDelivery.deliveryFee || "40"} Payout
                    </div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.95, marginTop: 4, fontWeight: 600 }}>
                      {remainingKm > 0 ? `${remainingKm.toFixed(1)} km route` : "Adalaj Area"}
                    </div>
                  </div>
                </div>

                {/* Uber-style auto-timeout progress bar */}
                <div style={{
                  background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "8px 12px",
                  marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between",
                  border: "1px dashed rgba(255,255,255,0.3)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.82rem", fontWeight: 700, color: "#FFF" }}>
                    <Clock size={15} style={{ animation: countdown <= 8 ? "pulse 0.6s infinite" : "none", color: countdown <= 8 ? "#FCA5A5" : "#FFF" }} />
                    <span>Auto-pass to next rider in <b>{countdown}s</b></span>
                  </div>
                  <div style={{ width: 110, height: 7, background: "rgba(255,255,255,0.25)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.max(0, (countdown / 25) * 100)}%`, height: "100%",
                      background: countdown > 12 ? "#4ADE80" : countdown > 6 ? "#FBBF24" : "#EF4444",
                      transition: "width 1s linear"
                    }} />
                  </div>
                </div>
              </div>

              {/* Offer Body */}
              <div style={{ padding: "20px" }}>
                {/* Pickup from Restaurant */}
                <div style={{
                  background: CARD, borderRadius: 16, padding: "14px 16px",
                  border: `1px solid ${INK_HAIR}`, marginBottom: 12
                }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", color: TC, letterSpacing: "0.08em", marginBottom: 4 }}>
                    🍽️ Pickup from Restaurant
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: INK }}>
                    {restaurantName}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: INK_MUTED, marginTop: 2 }}>
                    {restaurantAddress}
                  </div>
                </div>

                {/* Dropoff to Customer */}
                <div style={{
                  background: isHostel ? "#FAF5FF" : "#F0FDF4",
                  borderRadius: 16, padding: "14px 16px",
                  border: `1.5px solid ${isHostel ? "#E9D5FF" : "#BBF7D0"}`, marginBottom: 16
                }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", color: isHostel ? "#7E22CE" : "#15803D", letterSpacing: "0.08em", marginBottom: 4 }}>
                    {isHostel ? "🏠 Hostel Student Drop-Off" : "🏠 Customer Drop-Off"}
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: INK }}>
                    {customerName}
                  </div>
                  <div style={{ fontSize: "0.84rem", color: INK, marginTop: 2, fontWeight: 500 }}>
                    {customerAddress}
                  </div>
                </div>

                {/* Actions: Accept or Decline */}
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={handleDecline}
                    disabled={actionBusy}
                    style={{
                      flex: "0 0 38%", padding: "16px", borderRadius: 14,
                      border: "2px solid #FCA5A5", background: "#FEF2F2",
                      color: "#DC2626", fontWeight: 800, fontSize: "0.95rem",
                      cursor: actionBusy ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      opacity: actionBusy ? 0.6 : 1, transition: "all 0.2s"
                    }}
                  >
                    <XCircle size={20} /> Decline
                  </button>

                  <button
                    onClick={handleAccept}
                    disabled={actionBusy}
                    style={{
                      flex: 1, padding: "16px", borderRadius: 14, border: "none",
                      background: `linear-gradient(135deg, ${SUCCESS} 0%, #166534 100%)`,
                      color: "#FFF", fontWeight: 900, fontSize: "1.05rem",
                      cursor: actionBusy ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      boxShadow: "0 6px 20px rgba(21,128,61,0.4)",
                      opacity: actionBusy ? 0.6 : 1, transition: "all 0.2s"
                    }}
                  >
                    {actionBusy ? (
                      <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <><CheckCircle size={22} /> Accept Request</>
                    )}
                  </button>
                </div>

                <p style={{ textAlign: "center", fontSize: "0.74rem", color: INK_MUTED, marginTop: 12 }}>
                  Declining will pass this request to the next available rider in the queue.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ margin: "16px 16px 0", animation: "slide-up 0.3s ease-out" }}>
            {/* Main Delivery Box */}
            <div style={{
              background: "#FFF", borderRadius: 24, border: `1.5px solid ${TC}25`,
              overflow: "hidden", boxShadow: `0 10px 30px ${TC}12`
            }}>
            {/* Delivery Status Banner */}
            <div style={{
              background: isPickedUp
                ? "linear-gradient(135deg, #15803D 0%, #166534 100%)"
                : "linear-gradient(135deg, #C0401E 0%, #9A3412 100%)",
              color: "#FFF", padding: "18px 20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{
                    fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.12em", opacity: 0.95,
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(255,255,255,0.18)", padding: "3px 10px", borderRadius: 999, marginBottom: 4
                  }}>
                    {isPickedUp
                      ? "🛍️ DELIVERED TO RESTAURANT / ON THE WAY TO CUSTOMER"
                      : "🛵 DELIVERY BOY TO RESTAURANT"}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, marginTop: 2 }}>
                    Order #{(activeDelivery.orderId || "").slice(-6).toUpperCase()}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{
                    background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)",
                    padding: "4px 12px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 800
                  }}>
                    ₹{activeDelivery.deliveryFee || "40"} Payout
                  </div>
                  {activeDelivery.estimatedDeliveryMins > 0 && (
                    <div style={{ fontSize: "0.74rem", opacity: 0.9, marginTop: 4, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                      <Clock size={12} /> {activeDelivery.estimatedDeliveryMins} mins ETA
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stepper Progress */}
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${INK_HAIR}`, background: CARD }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {DELIVERY_STEPS.map((step, i) => {
                  const done = currentStep >= i;
                  const active = currentStep === i;
                  return (
                    <div key={step.key} style={{ flex: 1, display: "flex", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: done ? (active ? TC : SUCCESS) : "rgba(0,0,0,0.06)",
                          color: done ? "#FFF" : INK_MUTED,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.85rem", fontWeight: 700,
                          boxShadow: active ? `0 0 0 3px ${TC}30` : "none"
                        }}>
                          {done && !active ? "✓" : step.emoji}
                        </div>
                        <span style={{
                          fontSize: "0.62rem", fontWeight: 700, marginTop: 4,
                          color: active ? TC : done ? SUCCESS : INK_MUTED,
                          textTransform: "uppercase"
                        }}>{step.label}</span>
                      </div>
                      {i < DELIVERY_STEPS.length - 1 && (
                        <div style={{
                          flex: 1, height: 2, margin: "0 6px",
                          background: currentStep > i ? SUCCESS : "rgba(0,0,0,0.1)",
                          marginBottom: 16
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: "20px" }}>
              {/* ─── CUSTOMER DETAILS CARD (Primary User Request) ─── */}
              <div style={{
                background: isHostel ? "#FAF5FF" : "#F0FDF4",
                borderRadius: 18, padding: "18px", marginBottom: 16,
                border: `1.5px solid ${isHostel ? "#E9D5FF" : "#BBF7D0"}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isHostel ? <Building size={16} color="#7E22CE" /> : <MapPin size={16} color="#15803D" />}
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase",
                      letterSpacing: "0.08em", color: isHostel ? "#7E22CE" : "#15803D"
                    }}>
                      {isHostel ? "HOSTEL DROP-OFF LOCATION" : "CUSTOMER DROP-OFF"}
                    </span>
                  </div>

                  {isHostel && (
                    <span style={{
                      background: "#7E22CE", color: "#FFF", fontSize: "0.65rem",
                      fontWeight: 800, padding: "3px 8px", borderRadius: 999, textTransform: "uppercase"
                    }}>Hostel Student</span>
                  )}
                </div>

                {/* Customer Name */}
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: INK, marginBottom: 4 }}>
                  {customerName}
                </div>

                {/* Dropoff / Hostel Address */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 6 }}>
                  <MapPin size={16} style={{ color: TC, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, fontSize: "0.88rem", color: INK, lineHeight: 1.4, fontWeight: 500 }}>
                    {customerAddress}
                  </div>
                  <button onClick={() => copyToClipboard(customerAddress)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: copiedAddr ? SUCCESS : INK_MUTED, padding: 4
                  }} title="Copy Address">
                    {copiedAddr ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                {/* Special Instructions (Hostel Room, Gate instructions) */}
                {(activeDelivery.specialInstructions || orderDetails?.specialInstructions) && (
                  <div style={{
                    marginTop: 10, padding: "8px 12px", background: "rgba(0,0,0,0.04)",
                    borderRadius: 10, fontSize: "0.8rem", color: INK, display: "flex", gap: 6
                  }}>
                    <b>Note:</b> {activeDelivery.specialInstructions || orderDetails?.specialInstructions}
                  </div>
                )}

                {/* ─── One-Tap Call & Contact Customer Bar ─── */}
                <div style={{ display: "flex", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px dashed rgba(0,0,0,0.12)" }}>
                  {customerPhone ? (
                    <a href={`tel:${customerPhone}`} style={{
                      flex: 1, padding: "12px 14px", borderRadius: 12,
                      background: "#16A34A", color: "#FFF", textDecoration: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 8, fontSize: "0.88rem", fontWeight: 700,
                      boxShadow: "0 4px 12px rgba(22,163,74,0.3)"
                    }}>
                      <Phone size={16} /> Call {customerPhone}
                    </a>
                  ) : (
                    <div style={{
                      flex: 1, padding: "10px", borderRadius: 12,
                      background: "rgba(0,0,0,0.05)", color: INK_MUTED, fontSize: "0.8rem",
                      textAlign: "center"
                    }}>Phone not specified</div>
                  )}

                  {customerPhone && (
                    <a href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, "")}`}
                      target="_blank" rel="noopener noreferrer" style={{
                      padding: "12px 16px", borderRadius: 12, background: "#25D366",
                      color: "#FFF", textDecoration: "none", display: "flex",
                      alignItems: "center", justifyContent: "center", gap: 6,
                      fontSize: "0.88rem", fontWeight: 700
                    }}>
                      <MessageSquare size={16} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* ─── RESTAURANT PICKUP CARD ─── */}
              <div style={{
                background: "#FFFBF2", borderRadius: 18, padding: "18px", marginBottom: 16,
                border: "1.5px solid #FED7AA", boxShadow: "0 2px 10px rgba(194,65,12,0.04)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "1rem" }}>🍽️</span>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase",
                      letterSpacing: "0.08em", color: "#C2410C"
                    }}>
                      PICKUP RESTAURANT
                    </span>
                  </div>
                  <span style={{
                    background: "#FFEDD5", color: "#C2410C", fontSize: "0.65rem",
                    fontWeight: 800, padding: "3px 8px", borderRadius: 999, textTransform: "uppercase"
                  }}>Kitchen Counter</span>
                </div>

                {/* Restaurant Name */}
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: INK, marginBottom: 4 }}>
                  {restaurantName}
                </div>

                {/* Restaurant Address with Copy button */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 6 }}>
                  <MapPin size={16} style={{ color: TC, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, fontSize: "0.88rem", color: INK, lineHeight: 1.4, fontWeight: 500 }}>
                    {restaurantAddress}
                  </div>
                  <button onClick={() => copyRestAddress(restaurantAddress)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: copiedRestAddr ? SUCCESS : INK_MUTED, padding: 4
                  }} title="Copy Restaurant Address">
                    {copiedRestAddr ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                {/* Call & WhatsApp Restaurant Buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px dashed rgba(0,0,0,0.12)" }}>
                  <a href={`tel:${restaurantPhone}`} style={{
                    flex: 1, padding: "12px 14px", borderRadius: 12,
                    background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`, color: "#FFF", textDecoration: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, fontSize: "0.88rem", fontWeight: 700,
                    boxShadow: `0 4px 12px ${TC}30`
                  }}>
                    <Phone size={16} /> Call {restaurantPhone}
                  </a>

                  <a href={`https://wa.me/${restaurantPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank" rel="noopener noreferrer" style={{
                    padding: "12px 16px", borderRadius: 12, background: "#25D366",
                    color: "#FFF", textDecoration: "none", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: 6,
                    fontSize: "0.88rem", fontWeight: 700
                  }}>
                    <MessageSquare size={16} /> WhatsApp
                  </a>
                </div>
              </div>

              {/* ─── ORDER ITEMS SUMMARY (Collapsible checklist) ─── */}
              {orderDetails?.items && orderDetails.items.length > 0 && (
                <div style={{
                  background: "#FFF", borderRadius: 16, border: `1px solid ${INK_HAIR}`,
                  marginBottom: 18, overflow: "hidden"
                }}>
                  <div onClick={() => setShowItems(!showItems)} style={{
                    padding: "12px 16px", display: "flex", justifyContent: "space-between",
                    alignItems: "center", cursor: "pointer", background: "rgba(0,0,0,0.02)"
                  }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: INK, display: "flex", alignItems: "center", gap: 6 }}>
                      <ShoppingBag size={14} color={TC} />
                      Verify Order Items ({orderDetails.items.length} items)
                    </span>
                    {showItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {showItems && (
                    <div style={{ padding: "12px 16px", borderTop: `1px solid ${INK_HAIR}` }}>
                      {orderDetails.items.map((item, idx) => (
                        <div key={idx} style={{
                          display: "flex", justifyContent: "space-between",
                          padding: "6px 0", fontSize: "0.84rem",
                          borderBottom: idx < orderDetails.items.length - 1 ? "1px dashed rgba(0,0,0,0.06)" : "none"
                        }}>
                          <span><b>{item.quantity}×</b> {item.menuItemName || item.itemName}</span>
                          <span style={{ color: INK_MUTED }}>₹{item.totalPrice || item.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ─── ZOMATO RIDER ACTION BUTTONS ─── */}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                {!isPickedUp && (
                  <button onClick={handleDecline} disabled={actionBusy}
                    style={{
                      padding: "16px 18px", borderRadius: 14,
                      border: "1.5px solid rgba(220,38,38,0.25)",
                      background: "rgba(220,38,38,0.06)", color: "#DC2626",
                      fontWeight: 700, fontSize: "0.92rem", cursor: actionBusy ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 6, opacity: actionBusy ? 0.7 : 1
                    }}>
                    <XCircle size={18} /> Decline
                  </button>
                )}

                <button onClick={isPickedUp ? handleComplete : handlePickup} disabled={actionBusy}
                  style={{
                    flex: 1, padding: "18px", borderRadius: 14, border: "none",
                    background: isPickedUp
                      ? "linear-gradient(135deg, #16A34A 0%, #15803D 100%)"
                      : `linear-gradient(135deg, ${TC_SOFT} 0%, ${TC} 100%)`,
                    color: "#FFF", fontWeight: 800, fontSize: "1.05rem",
                    cursor: actionBusy ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    boxShadow: isPickedUp ? "0 6px 20px rgba(22,163,74,0.4)" : `0 6px 20px ${TC}40`,
                    opacity: actionBusy ? 0.7 : 1, transition: "all 0.2s"
                  }}>
                  {actionBusy ? (
                    <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
                  ) : isPickedUp ? (
                    <><CheckCircle size={22} /> Deliver Order to Customer</>
                  ) : (
                    <><Package size={22} /> Confirm Food Picked Up from Restaurant</>
                  )}
                </button>
              </div>

              <p style={{ textAlign: "center", fontSize: "0.76rem", color: INK_MUTED, marginTop: 12 }}>
                {isPickedUp
                  ? "Food collected from restaurant. Hand over food to customer at hostel/room, then tap 'Deliver Order to Customer'."
                  : "Ride to restaurant: Collect food from kitchen counter. Once food is received, tap 'Accept & Pick Up Food from Restaurant'."}
              </p>
            </div>
          </div>
        </div>
      )) : (
        /* ─── No Active Delivery State (Radar Search View) ─── */
        <div style={{ margin: "20px 16px 0" }}>
          <div style={{
            background: "#FFF", borderRadius: 24, border: `1px solid ${INK_HAIR}`,
            padding: "36px 24px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: isOnline ? `${SUCCESS}12` : "rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.2rem", margin: "0 auto 16px",
              boxShadow: isOnline ? `0 0 0 12px ${SUCCESS}08` : "none"
            }}>
              {isOnline ? "📡" : "💤"}
            </div>

            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: INK, marginBottom: 6 }}>
              {isOnline ? "Looking for nearby orders..." : "You're currently Offline"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: INK_MUTED, lineHeight: 1.5, maxWidth: 360, margin: "0 auto" }}>
              {isOnline
                ? "Keep this app open. New orders from nearby restaurants and hostel deliveries will appear here automatically."
                : "Tap 'GO ONLINE' in the top right to start receiving order requests."}
            </p>

            {!isOnline && (
              <button onClick={handleToggle} style={{
                marginTop: 20, padding: "14px 28px", borderRadius: 999, border: "none",
                background: "#15803D", color: "#FFF", fontWeight: 700, fontSize: "0.95rem",
                cursor: "pointer", boxShadow: "0 4px 16px rgba(21,128,61,0.3)"
              }}>
                Go Online Now 🚀
              </button>
            )}
          </div>

          {/* Rider Stats Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
            <StatCard label="Completed" value={driverProfile?.totalDeliveries || 0} emoji="📦" />
            <StatCard label="Rating" value={driverProfile?.avgRating ? `${driverProfile.avgRating} ★` : "5.0 ★"} emoji="⭐" color="#D97706" />
            <StatCard label="Earnings" value={`₹${(driverProfile?.totalDeliveries || 0) * 45}`} emoji="💰" color={SUCCESS} />
          </div>
        </div>
      )}

      {/* ─── Edit Profile Modal ─── */}
      {showEditProfile && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{
            background: "#FFF", borderRadius: 24, padding: "28px 24px",
            maxWidth: 440, width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            animation: "slide-up 0.25s ease-out"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: INK, margin: 0 }}>
                  ✏️ Edit Rider Profile
                </h3>
                <p style={{ fontSize: "0.78rem", color: INK_MUTED, margin: "4px 0 0" }}>
                  Update your display name, phone, and vehicle
                </p>
              </div>
              <button onClick={() => setShowEditProfile(false)} style={{
                background: "none", border: "none", cursor: "pointer", color: INK_MUTED, padding: 4
              }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: INK_MUTED, marginBottom: 6 }}>
                  Rider Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Jenish / Dhruhit"
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    background: FIELD, border: "1px solid rgba(0,0,0,0.06)",
                    fontSize: "0.92rem", fontWeight: 600, color: INK, outline: "none", boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: INK_MUTED, marginBottom: 6 }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    background: FIELD, border: "1px solid rgba(0,0,0,0.06)",
                    fontSize: "0.92rem", fontWeight: 600, color: INK, outline: "none", boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: INK_MUTED, marginBottom: 6 }}>
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  value={editForm.vehicleNumber}
                  onChange={e => setEditForm({ ...editForm, vehicleNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. GJ01AB1234"
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    background: FIELD, border: "1px solid rgba(0,0,0,0.06)",
                    fontSize: "0.92rem", fontWeight: 700, letterSpacing: "0.05em", color: INK, outline: "none", boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: INK_MUTED, marginBottom: 8 }}>
                  Vehicle Type
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["MOTORCYCLE", "🏍 Moto"], ["SCOOTER", "🛵 Scooty"], ["BICYCLE", "🚲 Bike"], ["CAR", "🚗 Car"]].map(([type, lbl]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, vehicleType: type })}
                      style={{
                        flex: 1, padding: "8px 2px", borderRadius: 10,
                        border: editForm.vehicleType === type ? `2px solid ${TC}` : `1px solid ${INK_HAIR}`,
                        background: editForm.vehicleType === type ? `${TC}10` : "#FFF",
                        color: editForm.vehicleType === type ? TC : INK_MUTED,
                        fontWeight: 700, fontSize: "0.75rem", cursor: "pointer"
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  style={{
                    flex: "0 0 35%", padding: "13px", borderRadius: 12,
                    border: `1px solid ${INK_HAIR}`, background: "#FFF",
                    color: INK_MUTED, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  style={{
                    flex: 1, padding: "13px", borderRadius: 12, border: "none",
                    background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
                    color: "#FFF", fontWeight: 800, fontSize: "0.95rem",
                    cursor: updatingProfile ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: `0 4px 14px ${TC}35`
                  }}
                >
                  {updatingProfile ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, emoji, color = INK }) {
  return (
    <div style={{
      background: "#FFF", borderRadius: 16, padding: "14px",
      border: `1px solid ${INK_HAIR}`, textAlign: "center"
    }}>
      <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color }}>
        {value}
      </div>
      <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: INK_MUTED, marginTop: 2 }}>
        {label}
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
    fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box"
  };

  return (
    <div style={{ padding: "32px 20px", maxWidth: 500, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>🛵</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: INK, marginBottom: 8 }}>
          Register as Driver
        </h2>
        <p style={{ fontSize: "0.9rem", color: INK_MUTED }}>
          Fill in your details to start delivering on MealMate
        </p>
      </div>

      <div style={{ background: "#FFF", borderRadius: 20, padding: "24px", border: `1px solid ${INK_HAIR}` }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: INK_MUTED, marginBottom: 8 }}>
            Vehicle Type
          </label>
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

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: INK_MUTED, marginBottom: 7 }}>
            Full Name *
          </label>
          <input value={form.name} onChange={s("name")} placeholder="Your full name" style={iStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: INK_MUTED, marginBottom: 7 }}>
            Phone Number *
          </label>
          <input value={form.phone} onChange={s("phone")} placeholder="+91 98765 43210" style={iStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: INK_MUTED, marginBottom: 7 }}>
            Vehicle Number *
          </label>
          <input value={form.vehicleNumber} onChange={s("vehicleNumber")} placeholder="e.g. DL 01 AB 1234" style={iStyle} />
        </div>

        <button onClick={handleRegister} disabled={loading} style={{
          width: "100%", marginTop: 8, padding: "15px", borderRadius: 14, border: "none",
          background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`, color: "#FFF",
          fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: `0 6px 20px ${TC}40`
        }}>
          {loading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
          Register as Driver
        </button>
      </div>
    </div>
  );
}
