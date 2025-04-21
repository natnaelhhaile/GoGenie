import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  IoPersonCircleSharp,
  IoHeart,
  IoLogOut,
  IoCreate,
  IoSearchOutline,
  IoPersonOutline
} from "react-icons/io5";
import { MdHomeFilled } from "react-icons/md";
import { FaHeart } from "react-icons/fa6";
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
      <div className="profile-header">
        <IoPersonCircleSharp className="profile-avatar" />
        <h2>{profileName}</h2>
        <p className="user-email">{auth.currentUser?.email}</p>
        <button className="edit-btn" onClick={() => navigate("/edit-profile")}>
          <IoCreate /> Edit Profile
        </button>
      </div>

      <div className="profile-actions">
        <button className="profile-action-btn" onClick={() => navigate("/favorites")}>
          <IoHeart /> Favorites
        </button>
        <button onClick={() => navigate("/update-preferences")} className="update-preferences">
          Update Preferences
        </button>
        <button className="profile-action-btn logout" onClick={handleLogout}>
          <IoLogOut /> Log Out
        </button>
      </div>

      <BottomNav />
      
    </Container>
  );
};

export default ProfilePage;
