import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Ensure you're using an Auth Context for user state

const ProtectedRoute = () => {
  const { user } = useAuth(); // Get user authentication state

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
