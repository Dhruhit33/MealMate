import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

// Backend DriverStatus enum: OFFLINE, ONLINE, ASSIGNED, PICKED_UP, DELIVERING
// Backend DeliveryStatus enum: PENDING, DRIVER_ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED, FAILED
const isOnlineStatus = (profile) =>
  profile?.status === "ONLINE" || profile?.status === "ASSIGNED" || profile?.status === "PICKED_UP" || profile?.status === "DELIVERING";

export const useDriverStore = create(
  persist(
    (set, get) => ({
      driverProfile: null,
      activeDelivery: null,
      deliveryHistory: [],
      isOnline: false,
      currentLocation: null,
      locationWatchId: null,
      loading: false,

      clearProfile: () => {
        set({ driverProfile: null, isOnline: false, activeDelivery: null, deliveryHistory: [] });
        const watchId = get().locationWatchId;
        if (watchId) navigator.geolocation.clearWatch(watchId);
      },

      fetchProfile: async () => {
        set({ loading: true });
        try {
          const res = await api.get("/driver/profile");
          const profile = res.data;
          set({
            driverProfile: profile,
            isOnline: isOnlineStatus(profile),
            loading: false,
          });
          return profile;
        } catch {
          set({ loading: false });
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
        set({ driverProfile: profile, isOnline: isOnlineStatus(profile) });
        return res.data;
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
        if (!navigator.geolocation) return;
        // Clear existing watch before creating new one
        const existingId = get().locationWatchId;
        if (existingId) navigator.geolocation.clearWatch(existingId);

        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            get().updateLocation(latitude, longitude);
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
        );
        set({ locationWatchId: watchId });
      },

      stopLocationTracking: () => {
        const watchId = get().locationWatchId;
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
          set({ locationWatchId: null });
        }
      },

      // Fetch active delivery — backend throws 500 if none exists, so handle gracefully
      fetchActiveDelivery: async () => {
        try {
          const res = await api.get("/delivery/driver/active");
          const delivery = res.data?.delivery || res.data;
          // Only set if it's a valid delivery object (has deliveryId)
          if (delivery && delivery.deliveryId) {
            set({ activeDelivery: delivery });
            return delivery;
          }
          set({ activeDelivery: null });
          return null;
        } catch {
          // 404/500 means no active delivery — that's OK
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

      confirmPickup: async () => {
        const res = await api.post("/delivery/pickup");
        const delivery = res.data?.delivery || res.data;
        set({ activeDelivery: delivery });
        return res.data;
      },

      completeDelivery: async () => {
        const res = await api.post("/delivery/complete");
        set({ activeDelivery: null });
        return res.data;
      },
    }),
    {
      name: "foodrush-driver",
      partialize: (state) => ({
        driverProfile: state.driverProfile,
        isOnline: state.isOnline,
      }),
    }
  )
);