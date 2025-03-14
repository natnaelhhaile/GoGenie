import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHeart, FaHome } from "react-icons/fa";
import "./Dashboard.css"; // Ensure styling is imported

const Dashboard = () => {
  const [userPreferences, setUserPreferences] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const user = auth.currentUser;
      if (user) {
        setMessage(`Good Morning, ${user.displayName || user.email.split("@")[0]}!`);
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
        <span className="greeting">🌞 {message}</span>
      </header>

      <section className="featured-section">
        <h3>Featured</h3>
        <div className="featured-list">
          <div className="featured-item">
            <img src="https://via.placeholder.com/150" alt="BJ's Restaurant" />
            <p>BJ's Restaurant & Brewhouse</p>
            <span>⏳ 20 Min</span>
          </div>
          <div className="featured-item">
            <img src="https://via.placeholder.com/150" alt="Fremont Biryani House" />
            <p>Fremont Biryani House</p>
            <span>⏳ 20 Min</span>
          </div>
        </div>
      </section>

      <section className="categories-section">
        <h3>Category <span className="see-all">See All</span></h3>
        <div className="category-list">
          <button className="category-btn selected">All</button>
          <button className="category-btn">Food</button>
          <button className="category-btn">Activities</button>
          <button className="category-btn">Drinks</button>
        </div>
      </section>

      <section className="places-section">
        <div className="place-item">
          <img src="https://via.placeholder.com/150" alt="Bowlero Milpitas" />
          <p>Bowlero Milpitas</p>
          <span>⏳ 20 Min</span>
        </div>
        <div className="place-item">
          <img src="https://via.placeholder.com/150" alt="Spin A Yarn Steakhouse" />
          <p>Spin A Yarn Steakhouse</p>
          <span>⏳ 20 Min</span>
        </div>
      </section>

      <div className="dashboard-footer">
        <button onClick={() => navigate("/profile-setup")} className="update-preferences">
          Update Preferences
        </button>
      </div>

      <footer className="bottom-nav">
        <FaHome className="nav-icon active" />
        <FaHeart className="nav-icon" />
      </footer>
    </div>
  );
};

export default Dashboard;
