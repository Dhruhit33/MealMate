import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";
import { useDriverStore } from "./driverStore";

// Synchronously read cached credentials from localStorage so initial render never starts unauthenticated on browser refresh
const getStoredAuth = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return { token: null, user: null };
  }
  try {
    let raw = window.localStorage.getItem("mealmate-auth");
    if (!raw) {
      raw = window.localStorage.getItem("foodrush-auth");
      if (raw) {
        try { window.localStorage.setItem("mealmate-auth", raw); } catch (e) {}
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.state && parsed.state.token) {
        return {
          token: parsed.state.token || null,
          user: parsed.state.user || null,
        };
      }
    }
  } catch (e) {
    console.warn("Failed to parse cached auth from localStorage:", e);
  }
  return { token: null, user: null };
};

const initialAuth = getStoredAuth();

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: initialAuth.token,
      user: initialAuth.user,
      isHydrated: true,

      get isAuthenticated() {
        return !!get().token;
      },

      login: async (email, password) => {
        const res = await api.post("/auth/login", { email, password });
        const { token, ...user } = res.data;
        set({ token, user });
        return user;
      },

      register: async (data) => {
        try {
          const res = await api.post("/auth/register", data);
          return res.data;
        } catch (err) {
          console.error("DEBUG: Registration failed:", {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message
          });
          throw err;
        }
      },

      verifyOtp: async (email, otp) => {
        try {
          const res = await api.post("/auth/verify-otp", { email, otp });
          const { token, ...user } = res.data;
          set({ token, user });
          return user;
        } catch (err) {
          console.error("DEBUG: OTP verification failed:", {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message
          });
          throw err;
        }
      },

      fetchProfile: async () => {
        const res = await api.get("/users/profile");
        set({ user: res.data });
        return res.data;
      },

      updateProfile: async (data) => {
        const res = await api.put("/users/profile", data);
        set({ user: res.data });
        return res.data;
      },

      logout: () => {
        set({ token: null, user: null });
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.removeItem("mealmate-auth");
            window.localStorage.removeItem("foodrush-auth");
          }
        } catch (e) {}
        if (useDriverStore.getState().clearProfile) {
          useDriverStore.getState().clearProfile();
        }
      },
    }),
    {
      name: "mealmate-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
