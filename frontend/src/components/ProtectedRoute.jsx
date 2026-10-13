import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import SkeletonPage from "./SkeletonPage";
import { normaliseRole } from "../api/roles";


export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user, fetchProfile, logout } = useAuthStore();
  const location = useLocation();

  // Bulletproof fallback: check localStorage directly to guarantee no race-condition on refresh
  let effectiveToken = token;
  let effectiveUser = user;
  if (!effectiveToken && typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem("mealmate-auth") || window.localStorage.getItem("foodrush-auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.token) {
          effectiveToken = parsed.state.token;
          effectiveUser = parsed.state.user || effectiveUser;
        }
      }
    } catch (e) {}
  }

  const [checking, setChecking] = useState(!effectiveUser && !!effectiveToken);

  useEffect(() => {
    let isMounted = true;
    if (effectiveToken && !effectiveUser) {
      setChecking(true);
      fetchProfile()
        .catch((err) => {
          // Only force logout on genuine 401 Unauthorized (expired/invalid token)
          // Never log out on incidental microservice hiccups or network drops
          if (err.response?.status === 401 && isMounted) {
            logout();
          }
        })
        .finally(() => {
          if (isMounted) setChecking(false);
        });
    } else {
      setChecking(false);
    }
    return () => { isMounted = false; };
  }, [effectiveToken, effectiveUser]);

  if (!effectiveToken) return <Navigate to="/login" state={{ from: location }} replace />;
  if (checking) return <SkeletonPage />;
  if (!effectiveUser) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    const role    = normaliseRole(effectiveUser.role);
    const allowed = allowedRoles.some(r => normaliseRole(r) === role);
    if (!allowed) {
      if (role === "RESTAURANT_OWNER") return <Navigate to="/owner" replace />;
      if (role === "DRIVER")           return <Navigate to="/driver" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
