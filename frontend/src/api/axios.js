import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== "undefined") {
    if (window.location.hostname === "13.234.110.133" || window.location.port === "80") {
      return "/api/v1";
    }
  }
  return "http://13.234.110.133/api/v1";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 12000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  let token = null;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem("mealmate-auth") || window.localStorage.getItem("foodrush-auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        token = parsed?.state?.token;
      }
    } catch (e) {}
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Track if we're already redirecting to avoid multiple logouts
let isLoggingOut = false;

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !isLoggingOut) {
      const url = err.config?.url || "";
      const isAuthEndpoint = url.includes("/auth/");
      const isProfileEndpoint = url.includes("/users/profile");

      // Only force logout if the core user profile endpoint fails with 401 (token genuinely invalid/expired)
      // Never log out the user on incidental 401s from microservices (e.g. wallet, orders)
      if (isProfileEndpoint && !isAuthEndpoint) {
        isLoggingOut = true;
        if (typeof window !== "undefined" && window.localStorage) {
          try {
            window.localStorage.removeItem("mealmate-auth");
            window.localStorage.removeItem("foodrush-auth");
          } catch (e) {}
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
        setTimeout(() => { isLoggingOut = false; }, 3000);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
