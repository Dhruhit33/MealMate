import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import SkeletonPage from "./SkeletonPage";
import { normaliseRole } from "../api/roles";


export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user, fetchProfile, logout } = useAuthStore();
  const location = useLocation();
  const [checking, setChecking] = useState(!user && !!token);

  useEffect(() => {
    let isMounted = true;
    if (token && !user) {
      setChecking(true);
      fetchProfile()
        .catch(() => {
          if (isMounted) logout();
        })
        .finally(() => {
          if (isMounted) setChecking(false);
        });
    } else {
      setChecking(false);
    }
    return () => { isMounted = false; };
  }, [token, user]);

  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  if (checking) return <SkeletonPage />;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    const role    = normaliseRole(user.role);
    const allowed = allowedRoles.some(r => normaliseRole(r) === role);
    if (!allowed) {
      if (role === "RESTAURANT_OWNER") return <Navigate to="/owner" replace />;
      if (role === "DRIVER")           return <Navigate to="/driver" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
