import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChildReaching, FaHeart } from "react-icons/fa6";
import { MdHomeFilled } from "react-icons/md";
import { GoClock } from "react-icons/go";
import { IoSearchOutline, IoPersonOutline, IoLocationSharp } from "react-icons/io5";
import "./Dashboard.css";
import Container from "../components/Container";

const Dashboard = () => {
  const [userPreferences, setUserPreferences] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(10); // Initial load
  const loaderRef = React.useRef(null);
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const imageSources = Array.from({ length: 10 }, (_, i) =>
    require(`../assets/dum${i + 1}.jpg`)
  );

  // 🚨 Redirect if no token
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${BACKEND_URL}/api/users/preferences`, { headers });

        if (response.status === 200) {
          setUserPreferences(response.data);
          setMessage(response.data.fname);
        }
      } catch (error) {
        console.error("❌ Error fetching preferences:", error);
      }
    };

    fetchUserPreferences();
  }, [BACKEND_URL]);

  useEffect(() => {
    const fetchAIRecommendations = async () => {
      setLoading(true);
    
      try {
        console.log("🧠 Generating AI recommendations");
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${BACKEND_URL}/api/recommendations/generate-recommendations`, { headers });
    
        if (Array.isArray(response.data.recommendations)) {
          setRecommendations(response.data.recommendations);
          console.log("✅ AI Recommendations received:", response.data.recommendations);
        } else {
          console.error("❌ Unexpected AI response format:", response.data);
        }
      } catch (error) {
        console.error("❌ Error fetching AI recommendations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRecommendations = async () => {
      if (!loading && userPreferences === null) {
        console.log("🔁 No preferences found after loading — redirecting...");
        navigate("/profile-setup");
        return;
      }
      
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${BACKEND_URL}/api/recommendations/cached-recommendations`, { headers });
  
        if (Array.isArray(response.data.recommendations)) {
          setRecommendations(response.data.recommendations);
  
          if (response.data.recommendations.length === 0) {
            console.log("ℹ️ No stored recommendations found. Triggering AI-based generation...");
            await fetchAIRecommendations(); // 🔁 Call AI recommendation logic
          }
        } else {
          console.error("❌ Unexpected response format:", response.data);
        }
      } catch (error) {
        console.error("❌ Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchRecommendations();
  }, [loading, navigate, userPreferences, BACKEND_URL]);  

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          setVisibleCount((prev) => prev + 10);
        }
      },
      { threshold: 1 }
    );
  
    const currentLoader = loaderRef.current; // capture ref
    if (currentLoader) {
      observer.observe(currentLoader);
    }
  
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, []);

  const hasMoreToLoad = recommendations.filter((recomend) => {
    if (activeCategory === "All") return true;
    return (recomend.venue?.categories || []).some((cat) =>
      cat.toLowerCase().includes(activeCategory.toLowerCase())
    );
  }).length > visibleCount;
  
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
            <p>Bowlero Milpitas</p>
            <span><GoClock className="clock-icon" /> 20 Min</span>
          </div>
          <div className="featured-item">
            <img src={require(`../assets/Spin_A_Yarn_Steakhouse.png`)} alt="Spin A Yarn Steakhouse" />
            <p>Spin A Yarn Steakhouse</p>
            <span><GoClock className="clock-icon" /> 20 Min</span>
          </div>
        </div>
      </section>

      <div className="category-label">
        <h3>Category</h3>
      </div>

      <section className="categories-section">
        <div className="category-list">
          {["All", "Food", "Activities", "Drinks"].map((cat) => (
            <button
              key={cat}
              className={`category-btn ${activeCategory === cat ? "selected" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="places-section">
        {loading ? (
          <div className="loading-container">
              <div className="spinner" />
              <p>Loading recommendations...</p>
            </div>
        ) : recommendations.length > 0 ? (
          <>
            {recommendations
            .filter((recommend) => {
              if (activeCategory === "All") return true;
              return (recommend.venue?.categories || []).some((cat) =>
                cat.toLowerCase().includes(activeCategory.toLowerCase())
              );
            })
            .slice(0, visibleCount) // Only show the visible ones
            .map((recommend, index) => {
              const venue = recommend.venue;
              const city = venue.location.locality || "Unknown City";
              const venueImage = venue.photos[0]

              return (
                <div key={venue.venue_id} className="place-item"
                  onClick={() => navigate("/venue-detail", { state: { venue } })}
                >
                  <img src={venueImage} alt={venue.name} />
                  <p>{venue.name}</p>
                  <div className="icons-row">
                    <span className="location-info">
                      <IoLocationSharp className="location-pin" />
                      <span className="city-name">{city}</span>
                    </span>
                  </div>
                </div>
              );
            })}

            <div ref={loaderRef} className="scroll-loader">
              {!loading && hasMoreToLoad ? (
                <p>Loading more...</p>
              ) : (
                <p>🎉 You’ve reached the end!</p>
              )}
            </div>
          </>
        ) : (
          <p className="no-results-text">
            No recommendations found yet. Try{" "}
            <span
              onClick={() => navigate("/profile-setup")}
            >
              updating your preferences
            </span>{" "}
            or refreshing.
          </p>
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
