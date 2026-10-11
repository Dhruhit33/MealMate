import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import SkeletonPage from "./SkeletonPage";
import { normaliseRole } from "../api/roles";

export default function RoleRoute() {
  const { token, user, fetchProfile } = useAuthStore();
  const [checking, setChecking] = useState(!user && !!token);

  useEffect(() => {
    let isMounted = true;
    if (token && !user) {
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
  }, [token, user]);

  if (!token) return <Navigate to="/login" replace />;
  if (checking) return <SkeletonPage />;

  const role = normaliseRole(user?.role || "");
  if (role === "RESTAURANT_OWNER") return <Navigate to="/owner" replace />;
  if (role === "DRIVER")           return <Navigate to="/driver" replace />;
  return <Navigate to="/" replace />;
}
