import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { IoPersonCircleSharp, IoHeart, IoLogOut, IoCreate } from "react-icons/io5";
import Container from "../components/Container"; // ✅ Import your shared container
import "./ProfilePage.css";

const ProfilePage = () => {
  const user = auth.currentUser;
  console.log("User Siem chekcing:", user); 
  const navigate = useNavigate();

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
        <h2>{user?.displayName || "User"}</h2>
        <p className="user-email">{user?.email}</p>
        <button className="edit-btn" onClick={() => navigate("/edit-profile")}>
          <IoCreate /> Edit Profile
        </button>
      </div>

      <div className="profile-actions">
        <button className="profile-action-btn" onClick={() => navigate("/favorites")}>
          <IoHeart /> Favorites
        </button>
        <button className="profile-action-btn logout" onClick={handleLogout}>
          <IoLogOut /> Log Out
        </button>
      </div>
    </Container>
  );
};

export default ProfilePage;
