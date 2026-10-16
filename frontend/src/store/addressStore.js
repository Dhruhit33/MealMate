import { create } from "zustand";
import api from "../api/axios";
import { useRestaurantStore } from "./restaurantStore";

// Fallback coordinates for major Gujarat cities in case address has 0,0
const CITY_COORDS = {
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  adalaj: { lat: 23.1644, lng: 72.5855 },
  gandhinagar: { lat: 23.2156, lng: 72.6369 },
  surat: { lat: 21.1702, lng: 72.8311 },
  rajkot: { lat: 22.3039, lng: 70.8022 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  baroda: { lat: 22.3072, lng: 73.1812 },
  bhavnagar: { lat: 21.7645, lng: 72.1519 },
  jamnagar: { lat: 22.4707, lng: 70.0577 },
};

export const getAddressCoords = (addr) => {
  if (!addr) return { lat: 23.1644, lng: 72.5855 };
  const lat = Number(addr.latitude);
  const lng = Number(addr.longitude);
  if (lat && lng && (Math.abs(lat) > 0.001 || Math.abs(lng) > 0.001)) {
    return { lat, lng };
  }
  const cityKey = (addr.city || addr.street || "").toLowerCase().trim();
  for (const [k, coords] of Object.entries(CITY_COORDS)) {
    if (cityKey.includes(k)) return coords;
  }
  return { lat: 23.1644, lng: 72.5855 }; // Default Adalaj
};

// Real Location Detector: Strictly queries HTML5 GPS from device hardware (never falls back to random ISP IP)
export async function detectCurrentLocation() {
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    const getPos = (highAcc, timeoutMs) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: timeoutMs,
          maximumAge: 0,
          enableHighAccuracy: highAcc,
        });
      });

    try {
      let pos;
      try {
        pos = await getPos(true, 15000);
      } catch (err) {
        if (err?.code === 1) throw err;
        pos = await getPos(false, 10000);
      }
      if (pos && pos.coords) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng, source: "gps", city: null };
        }
      }
    } catch (e) {
      console.warn("HTML5 Geolocation unavailable:", e?.message);
    }
  }

  return null;
}

const savedAddressId = typeof window !== "undefined" ? localStorage.getItem("mealmate_selected_address_id") : null;

export const useAddressStore = create((set, get) => ({
  addresses: [],
  selectedAddressId: savedAddressId || null,
  loading: false,

  setSelectedAddressId: (id) => {
    if (id) {
      localStorage.setItem("mealmate_selected_address_id", id);
    } else {
      localStorage.removeItem("mealmate_selected_address_id");
    }
    set({ selectedAddressId: id });
  },

  selectAddress: (addr) => {
    if (!addr) return;
    const id = addr.addressId;
    localStorage.setItem("mealmate_selected_address_id", id);
    set({ selectedAddressId: id });

    const coords = getAddressCoords(addr);
    const label = addr.city || addr.street || addr.label || "Saved Address";
    const displayName = addr.label ? `${addr.label}: ${label}` : label;

    // Synchronize restaurant store location & fetch hotels within 25km of this area
    const restStore = useRestaurantStore.getState();
    restStore.setLocation(displayName, coords.lat, coords.lng, 25, id);
    restStore.fetchNearby(coords.lat, coords.lng, 25);
    restStore.fetchTopRated(coords.lat, coords.lng, 25);
    restStore.fetchAvailableDrivers(coords.lat, coords.lng, 25);
  },

  fetchAddresses: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/users/addresses");
      const list = Array.isArray(res.data) ? res.data : [];
      let currentSelectedId = get().selectedAddressId;

      if (list.length > 0) {
        const found = list.find((a) => a.addressId === currentSelectedId);
        if (!found) {
          // Default to first address
          currentSelectedId = list[0].addressId;
          localStorage.setItem("mealmate_selected_address_id", currentSelectedId);
        }
      } else {
        currentSelectedId = null;
        localStorage.removeItem("mealmate_selected_address_id");
      }

      set({ addresses: list, selectedAddressId: currentSelectedId, loading: false });

      if (currentSelectedId) {
        const addr = list.find((a) => a.addressId === currentSelectedId);
        if (addr) {
          const coords = getAddressCoords(addr);
          const label = addr.city || addr.street || addr.label || "Saved Address";
          const displayName = addr.label ? `${addr.label}: ${label}` : label;
          const restStore = useRestaurantStore.getState();
          restStore.setLocation(displayName, coords.lat, coords.lng, 25, addr.addressId);
        }
      }
      return list;
    } catch {
      set({ loading: false });
      return [];
    }
  },

  addAddress: async (data) => {
    const res = await api.post("/users/addresses", data);
    const newAddr = res.data;
    set((s) => ({ addresses: [...s.addresses, newAddr] }));
    get().selectAddress(newAddr);
    return newAddr;
  },

  updateAddress: async (id, data) => {
    const res = await api.put(`/users/addresses/${id}`, data);
    const updated = res.data;
    set((s) => ({
      addresses: s.addresses.map((a) => (a.addressId === id ? updated : a)),
    }));
    if (get().selectedAddressId === id) {
      get().selectAddress(updated);
    }
    return updated;
  },

  deleteAddress: async (id) => {
    await api.delete(`/users/addresses/${id}`);
    const remaining = get().addresses.filter((a) => a.addressId !== id);
    let nextSelected = get().selectedAddressId;
    if (nextSelected === id) {
      nextSelected = remaining.length > 0 ? remaining[0].addressId : null;
      if (nextSelected) {
        get().selectAddress(remaining[0]);
      } else {
        localStorage.removeItem("mealmate_selected_address_id");
        // Reset restaurant store to default Adalaj
        useRestaurantStore.getState().setLocation("Annapurnadham, Adalaj", 23.1644, 72.5855, 25, null);
      }
    }
    set({
      addresses: remaining,
      selectedAddressId: nextSelected,
    });
  },
}));
