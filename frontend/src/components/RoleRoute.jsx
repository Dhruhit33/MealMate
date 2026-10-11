import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { normaliseRole } from "../api/roles";


export default function RoleRoute() {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  const role = normaliseRole(user?.role || "");
  if (role === "RESTAURANT_OWNER") return <Navigate to="/owner" replace />;
  if (role === "DRIVER")           return <Navigate to="/driver" replace />;
  return <Navigate to="/" replace />;
}
