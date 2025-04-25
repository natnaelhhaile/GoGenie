import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { GoClock } from "react-icons/go";
import { useAuth } from "../context/AuthContext";
import Container from "../components/Container";
import BottomNav from "../components/BottomNav";
import VenueCard from "../components/VenueCard";
import "./Dashboard.css";

const LIMIT = 10;

const featuredImages = {
  bj_restaurant: require("../assets/bj_restaurant.png"),
  Fremont_Biryani_House: require("../assets/Fremont_Biryani_House.png"),
  Bowlero_Milpitas: require("../assets/Bowlero_Milpitas.png"),
  Spin_A_Yarn_Steakhouse: require("../assets/Spin_A_Yarn_Steakhouse.png"),
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [userPreferences, setUserPreferences] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noMoreData, setNoMoreData] = useState(false);
  const [message, setMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [favoritesMap, setFavoritesMap] = useState({});
  const loaderRef = useRef(null);

  const fetchUserPreferences = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/users/preferences");
      if (res.status === 200) {
        setUserPreferences(res.data);
        setMessage(`${res.data.fname} ${res.data.lname}`);
      } else {
        console.warn("No preferences found, redirecting...");
        navigate("/profile-setup");
      }
    } catch (err) {
      console.error("Error fetching preferences:", err);
    }
  }, [navigate]);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get("/api/favorites/list");
      const favMap = {};
      res.data.favorites.forEach((fav) => {
        favMap[fav.venue_id] = true;
      });
      setFavoritesMap(favMap);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  }, [user]);

  const fetchAIRecommendations = async () => {
    try {
      const res = await axiosInstance.get("/api/recommendations/generate-recommendations");
      if (res.status === 200 && Array.isArray(res.data.recommendations)) {
        setRecommendations(res.data.recommendations);
        setOffset(LIMIT);
        if (res.data.recommendations.length < LIMIT) setNoMoreData(true);
      } else {
        navigate("/profile-setup");
      }
    } catch (err) {
      console.error("AI recommendations error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCachedRecommendations = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/recommendations/cached-recommendations?offset=${offset}&limit=${LIMIT}`);
      if (res.status === 200 && Array.isArray(res.data.recommendations)) {
        const newRecs = res.data.recommendations;
        setRecommendations((prev) => [...prev, ...newRecs]);
        setOffset((prev) => prev + LIMIT);
        if (newRecs.length < LIMIT) setNoMoreData(true);
      } else {
        setNoMoreData(true);
        if (offset === 0) await fetchAIRecommendations();
      }
    } catch (err) {
      console.error("Cached recommendations error:", err);
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    if (!user) return;

    // Load preferences and recommendations in parallel
    fetchUserPreferences();
    fetchCachedRecommendations();
    fetchFavorites();
  }, [user, fetchUserPreferences, fetchCachedRecommendations, fetchFavorites]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !noMoreData && !loading) {
          fetchCachedRecommendations();
        }
      },
      { threshold: 1 }
    );
    const currentLoader = loaderRef.current;
    if (currentLoader) observer.observe(currentLoader);
    return () => currentLoader && observer.unobserve(currentLoader);
  }, [fetchCachedRecommendations, noMoreData, loading]);

  const filteredRecommendations = recommendations.filter((rec) =>
    activeCategory === "All" ||
    (rec.venue?.categories || []).some((cat) =>
      cat.toLowerCase().includes(activeCategory.toLowerCase())
    )
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
      console.error("Error toggling favorite:", err);
    }
  };

  return (
    <Container>
      <header className="dashboard-header">
        <span>{message}</span>
      </header>

      <section className="featured-section">
        <h3 className="dashboard-subtitle">Featured</h3>
        <div className="featured-list">
          {Object.keys(featuredImages).map((name) => (
            <div key={name} className="featured-item">
              <picture>
                <source srcSet={featuredImages[name]} type="image/webp" />
                <img src={featuredImages[name]} alt={name.replace(/_/g, " ")} />
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
          {["All", "Food", "Activities", "Drinks", "Desserts", "Coffee", "Parks", "Games"].map((cat) => (
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
        {loading && recommendations.length === 0 ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading recommendations...</p>
          </div>
        ) : filteredRecommendations.length > 0 ? (
          <>
            {filteredRecommendations.map(({ venue }) => (
              <VenueCard
                key={venue.venue_id}
                venue={venue}
                isFavorite={favoritesMap[venue.venue_id]}
                onToggleFavorite={() => handleToggleFavorite(venue.venue_id)}
                onClick={() => navigate("/venue-detail", { state: { venue } })}
                showFavoriteIcon
              />
            ))}
            <div ref={loaderRef} className="scroll-loader">
              {filteredRecommendations.length > offset ? (
                <p>Loading more...</p>
              ) : (
                <p>🎉 You’ve reached the end!</p>
              )}
            </div>
          </>
        ) : (
          <p className="no-results-text">
            No recommendations found. Try{" "}
            <span onClick={() => navigate("/profile-setup")}>updating your preferences</span>{" "}
            or refreshing.
          </p>
        )}
      </section>

      <BottomNav />
    </Container>
  );
};

export default Dashboard;