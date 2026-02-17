import { Navigate, Outlet } from "react-router-dom";

/**
 * Wraps admin routes. If no token is found in localStorage,
 * the user is redirected to /login instead of accessing the page.
 */
const ProtectedRoute = () => {
  const token = localStorage.getItem("adminToken");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
