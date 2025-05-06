import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ProtectedRoute.css";

const ProtectedRoute = () => {
  const { user, authLoading } = useAuth();
  const location = useLocation();
  const isSharedLink =
    location.pathname.startsWith("/venue") &&
    new URLSearchParams(location.search).has("share");

  if (authLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div className="spinner" />
        <p>Checking authentication...</p>
      </div>
    );
  }

  // ✅ Allow access if user is logged in or it's a shared venue detail link
  return user || isSharedLink ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;