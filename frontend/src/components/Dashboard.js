import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChildReaching } from "react-icons/fa6";
import { FaHeart } from "react-icons/fa";
import { MdHomeFilled } from "react-icons/md";
import { GoClock } from "react-icons/go";
import { IoSearchOutline, IoPersonOutline, IoLocationSharp } from "react-icons/io5";
import { FaThumbsUp } from "react-icons/fa";
import { FaThumbsDown } from "react-icons/fa";
import "./Dashboard.css"; // Ensure styling is imported
import Container from "../components/Container"; // Adjust path if different
// import TestFoursquarePhotos from "./TestFoursquarePhotos"; // test if photos are loaded


const Dashboard = () => {
  const [userPreferences, setUserPreferences] = useState(null);
  const [recommendations, setRecommendations] = useState([]); // ✅ Store recommended places
  const [message, setMessage] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // ✅ Preload images from /assets/dum1.png to /assets/dum10.png for fallback
  const imageSources = Array.from({ length: 10 }, (_, i) =>
    require(`../assets/dum${i + 1}.jpg`)
  );

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const user = auth.currentUser;
      if (user) {
        setMessage(`${user.displayName || user.email.split("@")[0]}`);
        const userId = user.uid;

        try {
          const response = await axios.get(`${BACKEND_URL}/api/users/preferences/${userId}`);
          setUserPreferences(response.data);
        } catch (error) {
          console.error("❌ Error fetching preferences:", error);
        }
      }
    };

    const fetchRecommendations = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userId = user.uid;

      try {
        const response = await axios.get(`${BACKEND_URL}/api/recommendations/user-venues/${userId}`);
        if (Array.isArray(response.data.recommendations)) {
          setRecommendations(response.data.recommendations);
        } else {
          console.error("❌ Unexpected response format:", response.data);
        }
      } catch (error) {
        console.error("❌ Error fetching recommendations:", error);
      }
    };

    fetchUserPreferences();
    fetchRecommendations();
    
  }, [BACKEND_URL]);

  return (
    <Container>
      <header className="dashboard-header">
        <span className="greeting">
          <FaChildReaching className="greeting-icon" /> Hello!
        </span>
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
          <div className="featured-item">
            <img src={require(`../assets/Bowlero_Milpitas.png`)} alt="Bowlero Milpitas" />
            <p>Fremont Biryani House</p>
            <span><GoClock className="clock-icon" /> 20 Min</span>
          </div>
          <div className="featured-item">
            <img src={require(`../assets/Spin_A_Yarn_Steakhouse.png`)} alt="Spin A Yarn Steakhouse" />
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

      {/* ✅ Places Section (Updated to show recommendations) */}
      <section className="places-section">
        {recommendations.length > 0 ? (
          recommendations.map((venue, index) => {
            // ✅ Extract city from formatted address
            const addressParts = venue.location.address.split(",");
            const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : "Unknown City";
            // get images from the venue object photo
            const venueImage = venue.photos?.[0] || imageSources[index % imageSources.length]; // Fallback to preloaded images if none available
            return (
              <div key={venue.venue_id || index} className="place-item"
              onClick={() => navigate("/venue-detail", { state: { venue } })}
              style={{ cursor: "pointer" }}
              >
                <img src={venueImage} alt={venue.name} />
                <p>{venue.name}</p>
                <div className="icons-row">
                  <span><FaThumbsUp className="thumbs-up" /></span>
                  <span className="location-info">
                    <IoLocationSharp className="location-pin" />
                    <span className="city-name">{city}</span>
                  </span>
                  <span><FaThumbsDown className="thumbs-down" /></span>
                </div>
              </div>
            );
          })
        ) : (
          <>
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
          </>
        )}
      </section>

      <div className="dashboard-footer">
        <button onClick={() => navigate("/update-preferences")} className="update-preferences">
          Update Preferences
        </button>
      </div>

      <footer className="bottom-nav">
        <MdHomeFilled className="nav-icon active" />
        <IoSearchOutline className="nav-icon" />
        <FaHeart className="nav-icon favorites" onClick={() => navigate("/favorites")} />
        <IoPersonOutline className="nav-icon user" onClick={() => navigate("/profile")} />
      </footer>

     


    </Container>
  );
};

export default Dashboard;
