import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Track if we're already redirecting to avoid multiple logouts
let isLoggingOut = false;

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !isLoggingOut) {
      // Only logout on auth-critical endpoints, not on every 401
      const url = err.config?.url || "";
      const isAuthEndpoint = url.includes("/auth/");
      const isProfileEndpoint = url.includes("/users/profile");

      // If token exists but we got 401, it's expired — logout
      // But skip for non-critical endpoints that might just not exist
      const token = useAuthStore.getState().token;
      if (token && !isAuthEndpoint) {
        // Check if it's a genuine token expiry vs endpoint not found
        const msg = (err.response?.data?.message || "").toLowerCase();
        const isTokenExpired =
          msg.includes("expired") ||
          msg.includes("invalid token") ||
          msg.includes("unauthorized") ||
          msg.includes("jwt");

        if (isTokenExpired || isProfileEndpoint) {
          isLoggingOut = true;
          useAuthStore.getState().logout();
          window.location.href = "/login";
          setTimeout(() => { isLoggingOut = false; }, 2000);
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
