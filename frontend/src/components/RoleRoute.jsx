import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import SkeletonPage from "./SkeletonPage";
import { normaliseRole } from "../api/roles";

export default function RoleRoute() {
  const { token, user, fetchProfile } = useAuthStore();

  let effectiveToken = token;
  let effectiveUser = user;
  if (!effectiveToken && typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem("foodrush-auth");
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
        .catch(() => {})
        .finally(() => {
          if (isMounted) setChecking(false);
        });
    } else {
      setChecking(false);
    }
    return () => { isMounted = false; };
  }, [effectiveToken, effectiveUser]);

  if (!effectiveToken) return <Navigate to="/login" replace />;
  if (checking) return <SkeletonPage />;

  const role = normaliseRole(effectiveUser?.role || "");
  if (role === "RESTAURANT_OWNER") return <Navigate to="/owner" replace />;
  if (role === "DRIVER")           return <Navigate to="/driver" replace />;
  return <Navigate to="/" replace />;
}
