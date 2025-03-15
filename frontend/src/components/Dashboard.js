import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChildReaching } from "react-icons/fa6";
import { FaHeart, FaHome } from "react-icons/fa";
import { MdHomeFilled } from "react-icons/md";
import { GoClock } from "react-icons/go";
import { IoSearchOutline } from "react-icons/io5";
import { IoPersonOutline } from "react-icons/io5";

// import Container from "./Container"; // ✅ Import Container
import "./Dashboard.css"; // Ensure styling is imported

const Dashboard = () => {
  const [userPreferences, setUserPreferences] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const user = auth.currentUser;
      if (user) {
        setMessage(`${user.displayName || user.email.split("@")[0]}`);
        const userId = user.uid;

        try {
          const response = await axios.get(`http://localhost:5000/api/users/preferences/${userId}`);
          setUserPreferences(response.data);
        } catch (error) {
          console.error("❌ Error fetching preferences:", error);
        }
      }
    };

    fetchUserPreferences();
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <span className="greeting"><FaChildReaching className="greeting-icon" /> Hello!</span>
      </header>

      <section className="username-section">
      <h3 className="username">{message}</h3>
        </section>

      <section className="featured-section">
        <h3>Featured</h3>
        <div className="featured-list">
          <div className="featured-item">
            <img src={require(`../assets/bj_restaurant.png`)} alt="BJ's Restaurant" />
            <p>BJ's Restaurant & Brewhouse</p>
            <span><GoClock className="clock-icon" /> 20 Min</span>
          </div>
          <div className="featured-item">
            <img src={require(`../assets/Fremont_Biryani_House.png`)} alt="Fremont Biryani House" />
            <p>Fremont Biryani House</p>
            <span><GoClock className="clock-icon" /> 20 Min</span>
          </div>
        </div>
      </section>

      <div className="category-label">
        <h3>Category</h3>

      </div>
      <section className="categories-section">
        <div className="category-list">
          <button className="category-btn selected">All</button>
          <button className="category-btn">Food</button>
          <button className="category-btn">Activities</button>
          <button className="category-btn">Drinks</button>
        </div>
      </section>

      <section className="places-section">
        <div className="place-item">
          <img src={require(`../assets/Bowlero_Milpitas.png`)} alt="Bowlero Milpitas" />
          <p>Bowlero Milpitas</p>
          <span><GoClock className="clock-icon" /> 20 Min</span>
        </div>
        <div className="place-item">
          <img src={require(`../assets/Spin_A_Yarn_Steakhouse.png`)} alt="Spin A Yarn Steakhouse" />
          <p>Spin A Yarn Steakhouse</p>
          <span><GoClock className="clock-icon" /> 20 Min </span>
        </div>
      </section>

      <div className="dashboard-footer">
        <button onClick={() => navigate("/profile-setup")} className="update-preferences">
          Update Preferences
        </button>
      </div>

      <footer className="bottom-nav">
        <MdHomeFilled className="nav-icon active" />
        <IoSearchOutline className="nav-icon" />
        <FaHeart className="nav-icon" />
        <IoPersonOutline className="nav-icon" /> 
      </footer>
    </div>
  );
};

export default Dashboard;
