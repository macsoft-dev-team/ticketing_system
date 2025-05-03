// src/lib/role-guard.js
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function RoleGuard({ allowedRoles, children }) {
  const user = useSelector((state) => state.auth.user);

  if (!user) return <Navigate to="/login" />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // or to an unauthorized page
  }

  return children;
}
