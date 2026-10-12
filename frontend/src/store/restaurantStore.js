import { create } from "zustand";
import api from "../api/axios";

export const useRestaurantStore = create((set) => ({
  topRated: [],
  nearby: [],
  searchResults: [],
  current: null,
  categories: [],
  menuItems: [],
  reviews: [],
  loading: false,
  menuLoading: false,

  fetchTopRated: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/restaurants/top-rated");
      set({ topRated: Array.isArray(res.data) ? res.data : [], loading: false });
    } catch { set({ loading: false }); }
  },

  currentLocation: { name: "Annapurnadham, Adalaj", lat: 23.1644, lng: 72.5855, radius: 25 },

  setLocation: (name, lat, lng, radius = 25) => {
    set({ currentLocation: { name, lat, lng, radius } });
  },

  // Fetch restaurants within 25km radius (defaults to Gujarat / Adalaj 23.1644, 72.5855)
  fetchNearby: async (lat = 23.1644, lng = 72.5855, radius = 25) => {
    try {
      const res = await api.get("/restaurants/nearby", { params: { lat, lng, radius } });
      const list = Array.isArray(res.data) ? res.data : [];
      set({ nearby: list });
      return list;
    } catch {
      set({ nearby: [] });
      return [];
    }
  },

  searchRestaurants: async (query) => {
    set({ loading: true });
    try {
      const res = await api.get("/restaurants/search", { params: { keyword: query } });
      set({ searchResults: Array.isArray(res.data) ? res.data : [], loading: false });
    } catch { set({ loading: false }); }
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
}));
