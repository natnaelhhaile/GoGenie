import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdHomeFilled } from "react-icons/md";
import { IoSearch, IoPerson } from "react-icons/io5";
import { FaHeart } from "react-icons/fa";
import "./BottomNav.css";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <footer className="bottom-nav">
      <MdHomeFilled
        className={`nav-icon dashboard ${location.pathname === "/dashboard" ? "active" : ""}`}
        onClick={() => navigate("/dashboard")}
      />
      <IoSearch 
        className={`nav-icon search ${location.pathname === "/search" ? "active" : ""}`}
        onClick={() => navigate("/search")} />
      <FaHeart
        className={`nav-icon favorites ${location.pathname === "/favorites" ? "active" : ""}`}
        onClick={() => navigate("/favorites")}
      />
      <IoPerson
        className={`nav-icon user ${location.pathname === "/profile" ? "active" : ""}`}
        onClick={() => navigate("/profile")}
      />
    </footer>
  );
};

export default BottomNav;
