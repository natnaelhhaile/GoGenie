import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  IoPersonCircleSharp,
  IoOptions,
  IoLogOut,
  IoCreate
} from "react-icons/io5";
import Container from "../components/Container";
import axiosInstance from "../api/axiosInstance";
import "./ProfilePage.css";
import BottomNav from "../components/BottomNav";


const ProfilePage = () => {
  const [profileName, setProfileName] = useState("User");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axiosInstance.get("/api/users/preferences");
        const { fname, lname } = response.data;
        if (fname || lname) setProfileName(`${fname || ""} ${lname || ""}`.trim());
      } catch (error) {
        console.error("❌ Error fetching user preferences:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("❌ Error logging out:", error);
    }
  };

  return (
    <Container>
      <header className="profile-header">
        <span>My Profile</span>
      </header>
      <div className="profile-section">
        <div className="profile-info">
        <IoPersonCircleSharp className="profile-avatar" />
        <h2>{profileName}</h2>
        <p className="user-email">{auth.currentUser?.email}</p>
        </div>
        <div className="profile-settings">
          <button className="edit-btn" onClick={() => navigate("/edit-profile")}>
            <IoCreate /> Edit Profile
          </button>
          <button className="update-preferences" onClick={() => navigate("/update-preferences")}>
            <IoOptions /> Update Preferences
          </button>
          <button className="logout" onClick={handleLogout}>
            <IoLogOut /> Log Out
          </button>
        </div>
      </div>

      <BottomNav />
      
    </Container>
  );
};

export default ProfilePage;
