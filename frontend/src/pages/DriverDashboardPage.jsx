import { useEffect, useState } from "react";
import { Loader2, MapPin, CheckCircle2, Navigation, ToggleRight, ToggleLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { useDriverStore } from "../store/driverStore";

const INK = "#2B1D12";
const CARD = "#FFF9EC";
const TERRACOTTA = "#C14A2A";
const PISTACHIO = "#6B7F4A";
const PISTACHIO_LIGHT = "#E8F0E1";

export default function DriverDashboardPage() {
  const { user } = useAuthStore();
  const {
    driverProfile, activeDelivery, loading,
    fetchProfile, fetchActiveDelivery, goOnline, goOffline, confirmPickup, completeDelivery, updateLocation
  } = useDriverStore();
  
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchActiveDelivery();
    const interval = setInterval(() => {
      fetchActiveDelivery();
    }, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const toggleStatus = async () => {
    if (!driverProfile) return;
    setLocalLoading(true);
    if (!driverProfile.available) {
      // simulate location
      await goOnline(28.6139, 77.2090);
      toast.success("You are now ONLINE");
    } else {
      await goOffline();
      toast.success("You are now OFFLINE");
    }
    setLocalLoading(false);
  };

  const handleAction = async (action) => {
    setLocalLoading(true);
    try {
      if (action === 'PICKUP') {
        await confirmPickup();
        toast.success("Pickup confirmed!");
      } else {
        await completeDelivery();
        toast.success("Delivery completed!");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    } finally {
      setLocalLoading(false);
    }
  };

  if (loading && !driverProfile) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Loader2 className="spin" /></div>;
  }

  const isOnline = driverProfile?.available;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: INK }}>Driver Portal</h1>
          <p style={{ color: "#8A2F18" }}>Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={toggleStatus}
          disabled={localLoading || activeDelivery} // Prevent offline if active delivery
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 999, border: "none",
            background: isOnline ? PISTACHIO : "#E5E7EB",
            color: isOnline ? "#FFF" : INK,
            cursor: activeDelivery ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: "1rem", transition: "all 0.3s"
          }}
        >
          {isOnline ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          {isOnline ? "ONLINE" : "OFFLINE"}
        </button>
      </div>

      {!isOnline && !activeDelivery ? (
        <div style={{ padding: 60, textAlign: "center", background: CARD, borderRadius: 20 }}>
          <Navigation size={48} style={{ color: "#9CA3AF", margin: "0 auto 16px" }} />
          <h3>You are offline</h3>
          <p>Go online to start receiving delivery requests.</p>
        </div>
      ) : activeDelivery ? (
        <div style={{ background: CARD, borderRadius: 20, padding: 30, border: `2px solid ${TERRACOTTA}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, borderBottom: "1px solid #E5E7EB", paddingBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>Current Dispatch</span>
            <span style={{ color: TERRACOTTA, fontWeight: 700 }}>{activeDelivery.status}</span>
          </div>
          
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: PISTACHIO_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MapPin size={20} color={PISTACHIO} />
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>Pickup From</p>
              <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>{activeDelivery.restaurantName || "Restaurant"}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 30 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Navigation size={20} color={TERRACOTTA} />
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>Deliver To</p>
              <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>Customer Address</p>
            </div>
          </div>

          {activeDelivery.status === 'ASSIGNED' ? (
            <button
              onClick={() => handleAction('PICKUP')}
              disabled={localLoading}
              style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: TERRACOTTA, color: "#FFF", fontWeight: 700, fontSize: "1.1rem", cursor: "pointer" }}
            >
              Confirm Pickup
            </button>
          ) : activeDelivery.status === 'PICKED_UP' ? (
            <button
              onClick={() => handleAction('COMPLETE')}
              disabled={localLoading}
              style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: PISTACHIO, color: "#FFF", fontWeight: 700, fontSize: "1.1rem", cursor: "pointer" }}
            >
              Complete Delivery
            </button>
          ) : null}
        </div>
      ) : (
        <div style={{ padding: 60, textAlign: "center", background: CARD, borderRadius: 20 }}>
          <Loader2 size={48} className="spin" style={{ color: PISTACHIO, margin: "0 auto 16px" }} />
          <h3>Searching for orders...</h3>
          <p>Please stay in the app. A delivery request will appear here.</p>
        </div>
      )}
      <style>{`.spin { animation: spin 2s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
