import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";
import { useDriverStore } from "./driverStore";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

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
        if (useDriverStore.getState().clearProfile) {
          useDriverStore.getState().clearProfile();
        }
      },
    }),
    {
      name: "foodrush-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
