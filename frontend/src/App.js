import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Provide Auth State
// import Auth from "./components/Auth";
import Recommendation from "./components/Recommendation";
import Dashboard from "./components/Dashboard";
// import Home from "./components/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import ProfileSetup from "./components/ProfileSetup";
import VenueDetailPage from "./components/VenueDetailPage";
import FavoritesPage from "./components/FavoritesPage";
import ProfilePage from "./components/ProfilePage";
import EditProfilePage from "./components/EditProfilePage";
import UpdatePreferences from "./components/UpdatePreferences"; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* <Route path="/login2" element={<Auth />} /> */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
          <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/recommendation" element={<Recommendation />} />
            <Route path="/venue-detail" element={<VenueDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/edit-profile" element={<EditProfilePage />} />
            <Route path="/update-preferences" element={<UpdatePreferences />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
