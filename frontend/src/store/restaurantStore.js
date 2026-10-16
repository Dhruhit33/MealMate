import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

export const useRestaurantStore = create(
  persist(
    (set, get) => ({
      topRated: [],
      nearby: [],
      searchResults: [],
      current: null,
      categories: [],
      menuItems: [],
      reviews: [],
      availableDrivers: [],
      loading: false,
      menuLoading: false,

      fetchAvailableDrivers: async (lat, lng, radius = 25) => {
        try {
          const loc = get().currentLocation;
          const targetLat = lat ?? loc?.lat ?? 23.1644;
          const targetLng = lng ?? loc?.lng ?? 72.5855;
          const res = await api.get("/delivery/available-drivers", {
            params: { lat: targetLat, lng: targetLng, radius }
          });
          const list = Array.isArray(res.data) ? res.data : [];
          set({ availableDrivers: list });
          return list;
        } catch {
          set({ availableDrivers: [] });
          return [];
        }
      },

      currentLocation: { name: "Annapurnadham, Adalaj", lat: 23.1644, lng: 72.5855, radius: 25, addressId: null },

      setLocation: (name, lat, lng, radius = 25, addressId = null) => {
        set({ currentLocation: { name, lat, lng, radius, addressId } });
      },

      fetchTopRated: async (lat, lng, radius = 25) => {
        // Only show spinner if we don't have any cached restaurants yet (instant load!)
        if (get().topRated.length === 0) {
          set({ loading: true });
        }
        try {
          const loc = get().currentLocation;
          const targetLat = lat ?? loc?.lat ?? 23.1644;
          const targetLng = lng ?? loc?.lng ?? 72.5855;
          const res = await api.get("/restaurants/top-rated", {
            params: { lat: targetLat, lng: targetLng, radius }
          });
          const list = (Array.isArray(res.data) ? res.data : []).map(r => {
            if (r.distanceKm == null && r.latitude != null && r.longitude != null) {
              r.distanceKm = calculateDistanceKm(targetLat, targetLng, r.latitude, r.longitude);
            }
            return r;
          }).filter(r => r.distanceKm != null && r.distanceKm <= radius);

          set({ topRated: list, loading: false });
          return list;
        } catch {
          set({ loading: false });
          return get().topRated;
        }
      },

      // Fetch restaurants strictly within 25km radius
      fetchNearby: async (lat, lng, radius = 25) => {
        try {
          const loc = get().currentLocation;
          const targetLat = lat ?? loc?.lat ?? 23.1644;
          const targetLng = lng ?? loc?.lng ?? 72.5855;
          const res = await api.get("/restaurants/nearby", { params: { lat: targetLat, lng: targetLng, radius } });
          const list = (Array.isArray(res.data) ? res.data : []).map(r => {
            if (r.distanceKm == null && r.latitude != null && r.longitude != null) {
              r.distanceKm = calculateDistanceKm(targetLat, targetLng, r.latitude, r.longitude);
            }
            return r;
          }).filter(r => r.distanceKm != null && r.distanceKm <= radius);

          set({ nearby: list });
          return list;
        } catch {
          return get().nearby;
        }
      },

  searchRestaurants: async (query, lat, lng, radius = 25) => {
    set({ loading: true });
    try {
      const loc = get().currentLocation;
      const targetLat = lat ?? loc?.lat ?? 23.1644;
      const targetLng = lng ?? loc?.lng ?? 72.5855;
      const res = await api.get("/restaurants/search", {
        params: { keyword: query, query, lat: targetLat, lng: targetLng, radius }
      });
      const list = (Array.isArray(res.data) ? res.data : []).map(r => {
        if (r.distanceKm == null && r.latitude != null && r.longitude != null) {
          r.distanceKm = calculateDistanceKm(targetLat, targetLng, r.latitude, r.longitude);
        }
        return r;
      }).filter(r => r.distanceKm == null || r.distanceKm <= radius);
      set({ searchResults: list, loading: false });
      return list;
    } catch {
      set({ loading: false });
      return [];
    }
  },

  fetchRestaurant: async (id) => {
    set({ loading: true, current: null });
    try {
      const [details, categories, items, reviews] = await Promise.all([
        api.get(`/restaurants/${id}`),
        api.get(`/restaurants/${id}/menu/categories`),
        api.get(`/restaurants/${id}/menu/all`),
        api.get(`/restaurants/${id}/reviews`).catch(() => ({ data: [] })),
      ]);
      set({
        current: details.data,
        categories: Array.isArray(categories.data) ? categories.data : [],
        menuItems: Array.isArray(items.data) ? items.data : [],
        reviews: Array.isArray(reviews.data) ? reviews.data : [],
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  submitReview: async (restaurantId, rating, comment) => {
    const res = await api.post(`/restaurants/${restaurantId}/reviews`, { rating, comment });
    set((s) => ({ reviews: [res.data, ...s.reviews] }));
    return res.data;
  },
}),
{
  name: "mealmate-restaurants",
  partialize: (state) => ({ topRated: state.topRated, nearby: state.nearby }),
}
));
