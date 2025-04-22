import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = () => {
  const { user, authLoading } = useAuth();

  if (authLoading) return null; // You can return a spinner or skeleton here

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;