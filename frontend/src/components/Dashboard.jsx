import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import {
  GoClock
} from "react-icons/go";
import { useAuth } from "../context/AuthContext";
import { IoLocationSharp, IoHeartOutline, IoHeart } from "react-icons/io5";
import Container from "../components/Container";
import "./Dashboard.css";
import BottomNav from "../components/BottomNav";
import VenueCard from "../components/VenueCard";
import ChatLauncher from "../components/ChatLauncher";


const Dashboard = () => {
  const [userPreferences, setUserPreferences] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(10);
  const { user } = useAuth();
  const [favoritesMap, setFavoritesMap] = useState({});
  const loaderRef = React.useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const res = await axiosInstance.get("/api/users/preferences");
        if (res.status === 200) {
          setUserPreferences(res.data);
          setMessage(`${res.data.lname}, ${res.data.fname}`);
        }
      } catch (err) {
        console.error("Error fetching preferences:", err);
      }
    };
    fetchUserPreferences();
    const fetchFavorites = async () => {
      try {
        const res = await axiosInstance.get("/api/favorites/list");
        const map = {};
        res.data.favorites.forEach((fav) => {
          map[fav.venue_id] = true;
        });
        setFavoritesMap(map);
      } catch (err) {
        console.error("❌ Error fetching favorites:", err);
      }
    };
  
    if (user) fetchFavorites();   
  }, [user]);

  useEffect(() => {
    const fetchAIRecommendations = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/api/recommendations/generate-recommendations");
        if (Array.isArray(res.data.recommendations)) {
          setRecommendations(res.data.recommendations);
        }
      } catch (err) {
        console.error("AI fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      if (!loading && userPreferences === null) return navigate("/profile-setup");
      try {
        const res = await axiosInstance.get("/api/recommendations/cached-recommendations");
        if (Array.isArray(res.data.recommendations)) {
          setRecommendations(res.data.recommendations);
          if (res.data.recommendations.length === 0) await fetchAIRecommendations();
        }
      } catch (err) {
        console.error("Fetch recommendations error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [loading, navigate, userPreferences]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) setVisibleCount((prev) => prev + 10);
    }, { threshold: 1 });

    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);
    return () => currentLoader && observer.unobserve(currentLoader);
  }, []);

  const filteredRecommendations = recommendations.filter((rec) =>
    activeCategory === "All" ||
    (rec.venue?.categories || []).some((cat) => cat.toLowerCase().includes(activeCategory.toLowerCase()))
  );

  const handleToggleFavorite = async (venue_id) => {
    if (!user) return alert("Please log in to manage favorites.");
  
    try {
      if (favoritesMap[venue_id]) {
        await axiosInstance.post("/api/favorites/remove", { venue_id });
        setFavoritesMap((prev) => {
          const copy = { ...prev };
          delete copy[venue_id];
          return copy;
        });
      } else {
        await axiosInstance.post("/api/favorites/add", { venue_id });
        setFavoritesMap((prev) => ({ ...prev, [venue_id]: true }));
      }
    } catch (err) {
      console.error("❌ Error toggling favorite:", err);
    }
  };
  

  return (
    <Container>
      <header className="dashboard-header">
        <span className="greeting">{message}</span>
      </header>

      <section className="featured-section">
        <h3 className="dashboard-subtitle">Featured</h3>
        <div className="featured-list">
          {["bj_restaurant", "Fremont_Biryani_House", "Bowlero_Milpitas", "Spin_A_Yarn_Steakhouse"].map((name) => (
            <div key={name} className="featured-item">
              <picture>
                <source srcSet={require(`../assets/${name}.png`)} type="image/webp" />
                <img src={require(`../assets/${name}.png`)} alt={name} />
              </picture>
              <p>{name.replace(/_/g, " ")}</p>
              <span><GoClock className="clock-icon" /> 20 Min</span>
            </div>
          ))}
        </div>
      </section>

      <section className="categories-section">
        <h3 className="dashboard-subtitle">Categories</h3>
        <div className="category-list">
          {["All", "Food", "Activities", "Drinks", "Drinks", "Drinks", "Drinks", "Drinks"].map((cat) => (
            <button
              key={cat}
              title={`Show ${cat} venues`}
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
        ) : filteredRecommendations.length > 0 ? (
          <>
            {filteredRecommendations.slice(0, visibleCount).map((recommend) => {
              const venue = recommend.venue;
              const city = venue.location.locality || "Unknown City";
              const venueImage = venue.photos?.[0] || require("../assets/dum1.jpg");
              return (
                <VenueCard
                  key={venue.venue_id}
                  venue={venue}
                  isFavorite={favoritesMap[venue.venue_id]}
                  onToggleFavorite={() => handleToggleFavorite(venue.venue_id)}
                  onClick={() => navigate("/venue-detail", { state: { venue } })}
                  showFavoriteIcon
                />
              );
            })}
            <div ref={loaderRef} className="scroll-loader">
              {!loading && filteredRecommendations.length > visibleCount ? (
                <p>Loading more...</p>
              ) : (
                <p>🎉 You’ve reached the end!</p>
              )}
            </div>
          </>
        ) : (
          <p className="no-results-text">No recommendations found yet. Try <span onClick={() => navigate("/profile-setup")}>updating your preferences</span> or refreshing.</p>
        )}
      </section>
      
      <ChatLauncher isOpen={isChatOpen} setIsOpen={setIsChatOpen} />

      <BottomNav />

    </Container>
  );
};

export default Dashboard;