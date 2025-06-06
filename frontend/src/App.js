import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import ProfileSetup from "./components/ProfileSetup";
import VenueDetailPage from "./components/VenueDetailPage";
import FavoritesPage from "./components/FavoritesPage";
import ProfilePage from "./components/ProfilePage";
import EditProfilePage from "./components/EditProfilePage";
import UpdatePreferences from "./components/UpdatePreferences";
import ForgotPassword from "./components/ForgotPassword";
import Search from "./components/Search";
import useSessionExpiration from "./hooks/useSessionExpiration";
import { ToastProvider } from "./context/ToastContext";
import Toast from "./components/Toast"; 

function AppRoutes() {
  useSessionExpiration();

  return (
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/venue-detail" element={<VenueDetailPage />} />
          <Route path="/venue/:venue_id" element={<VenueDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/update-preferences" element={<UpdatePreferences />} />
          <Route path="/search" element={<Search />} />
        </Route>
      </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
          <Toast />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;