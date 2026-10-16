import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";
import { detectCurrentLocation } from "./addressStore";

// Backend DriverStatus enum: OFFLINE, ONLINE, ASSIGNED, PICKED_UP, DELIVERING
// Backend DeliveryStatus enum: PENDING, DRIVER_ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED, FAILED
const isOnlineStatus = (profile) =>
  profile?.status === "ONLINE" || profile?.status === "ASSIGNED" || profile?.status === "PICKED_UP" || profile?.status === "DELIVERING";

if (typeof window !== "undefined" && window.localStorage) {
  try {
    if (!window.localStorage.getItem("mealmate-driver") && window.localStorage.getItem("foodrush-driver")) {
      window.localStorage.setItem("mealmate-driver", window.localStorage.getItem("foodrush-driver"));
    }
  } catch (e) {}
}

export const useDriverStore = create(
  persist(
    (set, get) => ({
      driverProfile: null,
      activeDelivery: null,
      deliveryHistory: [],
      isOnline: false,
      currentLocation: null,
      locationWatchId: null,
      locationIntervalId: null,
      loading: false,

      clearProfile: () => {
        set({ driverProfile: null, isOnline: false, activeDelivery: null, deliveryHistory: [] });
        const watchId = get().locationWatchId;
        if (watchId && typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchId);
        }
        const intervalId = get().locationIntervalId;
        if (intervalId) clearInterval(intervalId);
        set({ locationWatchId: null, locationIntervalId: null });
      },

      fetchProfile: async () => {
        set({ loading: true });
        try {
          const res = await api.get("/driver/profile");
          const profile = res.data?.driver || res.data;
          if (profile && profile.driverId) {
            set({
              driverProfile: profile,
              isOnline: isOnlineStatus(profile),
              loading: false,
            });
            return profile;
          }
          set({ driverProfile: null, isOnline: false, loading: false });
          return null;
        } catch {
          set({ driverProfile: null, isOnline: false, loading: false });
          return null;
        }
      },

      registerDriver: async (data) => {
        const payload = {
          name: data.name,
          phone: data.phone,
          vehicleType: data.vehicleType,
          vehicleNum: data.vehicleNumber || data.vehicleNum,
        };
        const res = await api.post("/driver/register", payload);
        const profile = res.data?.driver || res.data;
        set({ driverProfile: profile, isOnline: false });
        return profile;
      },

      updateProfile: async (data) => {
        const payload = {
          name: data.name,
          phone: data.phone,
          vehicleType: data.vehicleType,
          vehicleNum: data.vehicleNumber || data.vehicleNum,
        };
        const res = await api.put("/driver/profile", payload);
        const profile = res.data?.driver || res.data;
        set({ driverProfile: profile });
        return profile;
      },

      goOnline: async (latitude, longitude) => {
        // Set optimistically first to prevent UI flicker
        set({ isOnline: true });
        try {
          const res = await api.post("/driver/go-online", null, {
            params: { latitude, longitude },
          });
          const profile = res.data?.driver || res.data;
          set({ isOnline: true, driverProfile: profile });
          return res.data;
        } catch (err) {
          set({ isOnline: false }); // Revert on failure
          throw err;
        }
      },

      goOffline: async () => {
        set({ isOnline: false }); // Optimistic
        try {
          const res = await api.post("/driver/go-offline");
          const profile = res.data?.driver || res.data;
          set({ isOnline: false, driverProfile: profile });
          const watchId = get().locationWatchId;
          if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            set({ locationWatchId: null });
          }
          return res.data;
        } catch (err) {
          set({ isOnline: true }); // Revert on failure
          throw err;
        }
      },

      updateLocation: async (latitude, longitude) => {
        const driverId = get().driverProfile?.driverId;
        if (!driverId) return;
        set({ currentLocation: { latitude, longitude } });
        try {
          await api.post("/driver/location", { driverId, latitude, longitude });
        } catch {}
      },

      startLocationTracking: () => {
        const triggerFallback = async () => {
          try {
            const loc = await detectCurrentLocation();
            if (loc && loc.lat && loc.lng) {
              get().updateLocation(loc.lat, loc.lng);
            }
          } catch (e) {}
        };

        // Clear existing watch and interval before creating new ones
        const existingWatchId = get().locationWatchId;
        if (existingWatchId && typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.clearWatch(existingWatchId);
        }
        const existingInterval = get().locationIntervalId;
        if (existingInterval) clearInterval(existingInterval);

        // Immediate position fetch fallback
        triggerFallback();

        let watchId = null;
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              get().updateLocation(latitude, longitude);
            },
            (err) => {
              console.warn("Geolocation watchPosition failed, using fallback:", err?.message);
              triggerFallback();
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
          );
        }

        // Periodic tracking interval (every 10s while driver is online)
        const intervalId = setInterval(() => {
          if (!get().isOnline) return;
          triggerFallback();
        }, 10000);

        set({ locationWatchId: watchId, locationIntervalId: intervalId });
      },

      stopLocationTracking: () => {
        const watchId = get().locationWatchId;
        if (watchId && typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchId);
        }
        const intervalId = get().locationIntervalId;
        if (intervalId) clearInterval(intervalId);
        set({ locationWatchId: null, locationIntervalId: null });
      },

      // Fetch active delivery for the logged-in driver
      fetchActiveDelivery: async () => {
        try {
          const res = await api.get("/delivery/driver/active");
          const delivery = res.data?.delivery || res.data;
          if (delivery && delivery.deliveryId) {
            set({ activeDelivery: delivery });
            return delivery;
          }
          set({ activeDelivery: null });
          return null;
        } catch {
          set({ activeDelivery: null });
          return null;
        }
      },

      fetchDeliveryHistory: async () => {
        try {
          const res = await api.get("/delivery/driver/history");
          const deliveries = res.data?.deliveries || res.data || [];
          set({ deliveryHistory: Array.isArray(deliveries) ? deliveries : [] });
        } catch {}
      },

      acceptDelivery: async () => {
        const res = await api.post("/delivery/accept");
        const delivery = res.data?.delivery || res.data;
        set({ activeDelivery: delivery, isOnline: true });
        try { await get().fetchProfile(); } catch {}
        return res.data;
      },

      confirmPickup: async () => {
        const res = await api.post("/delivery/pickup");
        const delivery = res.data?.delivery || res.data;
        set({ activeDelivery: delivery });
        return res.data;
      },

      declineDelivery: async () => {
        const res = await api.post("/delivery/decline");
        set({ activeDelivery: null, isOnline: true });
        try { await get().fetchProfile(); } catch {}
        try { await get().fetchDeliveryHistory(); } catch {}
        return res.data;
      },

      completeDelivery: async () => {
        const res = await api.post("/delivery/complete");
        set({ activeDelivery: null, isOnline: true });
        try { await get().fetchProfile(); } catch {}
        try { await get().fetchDeliveryHistory(); } catch {}
        return res.data;
      },
    }),
    {
      name: "mealmate-driver",
      partialize: (state) => ({
        driverProfile: state.driverProfile,
        isOnline: state.isOnline,
      }),
    }
  )
);

if (typeof window !== "undefined") {
  window.__mealmate_clear_driver = () => {
    try {
      useDriverStore.getState().clearProfile();
    } catch {}
  };
}