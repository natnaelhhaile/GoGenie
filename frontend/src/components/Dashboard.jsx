import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Container from "../components/Container";
import BottomNav from "../components/BottomNav";
import VenueCard from "../components/VenueCard";
import FeaturedCard from "../components/FeaturedCard";
import ChatLauncher from "../components/ChatLauncher";
import "./Dashboard.css";

const LIMIT = 10;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [userPreference, setUserPreferences] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noMoreData, setNoMoreData] = useState(false);
  const [message, setMessage] = useState("");
  const [favoritesMap, setFavoritesMap] = useState({});
  const [categories, setCategories] = useState(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [featured, setFeatured] = useState([]);
  const [becauseYouLiked, setBecauseYouLiked] = useState([]);
  const loaderRef = useRef(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchUserPreferences = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/users/preferences");
      if (res.status === 200) {
        setUserPreferences(res.data);
        setMessage(`${res.data.lname}, ${res.data.fname}`);
      } else {
        navigate("/profile-setup");
      }
    } catch (err) {
      console.error("Error fetching preferences:", err);
    }
  }, [navigate]);

  const fetchFeatured = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/recommendations/featured");
      if (res.status === 200 && Array.isArray(res.data.featured)) {
        setFeatured(res.data.featured);
      }
    } catch (err) {
      console.error("Error fetching featured:", err);
    }
  }, []);

  const fetchBecauseYouLiked = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/recommendations/because-you-liked");
      if (res.status === 200 && Array.isArray(res.data.results)) {
        setBecauseYouLiked(res.data.results);
      }
    } catch (err) {
      if (err.response && err.response.status === 204) {
        console.log("No liked venues yet");
      } else {
        console.error("Error fetching because-you-liked:", err);
      }
    }
  }, []);

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

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/recommendations/categories");
      if (res.status === 200 && Array.isArray(res.data.categories)) {
        setCategories(["All", ...res.data.categories]);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  const fetchAIRecommendations = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/recommendations/generate-recommendations");
      if (res.status === 200 && Array.isArray(res.data.recommendations)) {
        setRecommendations(res.data.recommendations);
        setOffset(LIMIT);
        if (res.data.recommendations.length === 0 || res.data.recommendations.length < LIMIT) {
          setNoMoreData(true);
        }
      } else {
        navigate("/profile-setup");
      }
    } catch (err) {
      console.error("AI recommendations error:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchCachedRecommendations = useCallback(async () => {
    try {
      const res = await axiosInstance.get(
        `/api/recommendations/cached-recommendations?offset=${offset}&limit=${LIMIT}`
      );

      if (res.status === 204 || !Array.isArray(res.data.recommendations)) {
        if (offset === 0) {
          await fetchAIRecommendations();
        } else {
          setNoMoreData(true);
        }
        return;
      }

      const newRecs = res.data.recommendations;
      setRecommendations((prev) => [...prev, ...newRecs]);
      setOffset((prev) => prev + LIMIT);
      if (newRecs.length < LIMIT) setNoMoreData(true);

    } catch (err) {
      console.error("Cached recommendations error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchAIRecommendations, offset]);

  useEffect(() => {
    if (!user) return;

    fetchUserPreferences();
    fetchCachedRecommendations();
    fetchFavorites();
    fetchCategories();
    fetchFeatured();
    fetchBecauseYouLiked();
  }, [user, fetchUserPreferences, fetchCachedRecommendations, fetchFavorites, fetchCategories, fetchFeatured, fetchBecauseYouLiked]);

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

      {/* 🔥 Featured Section */}
      <section className="featured-section">
        <h3 className="dashboard-subtitle">Featured</h3>
        <div className="featured-list">
          {featured.map((venue) => (
            <FeaturedCard
              key={venue.venue_id}
              venue={venue}
              onClick={() => navigate("/venue-detail", { state: { venue } })}
            />
          ))}
        </div>
      </section>

      {/* 🔥 Because You Liked Section */}
      {becauseYouLiked.length > 0 && (
        <section className="because-liked-section">
          <h3 className="dashboard-subtitle">You might also love...</h3>
          <div className="featured-list">
            {becauseYouLiked.map((venue) => (
              <FeaturedCard
                key={venue.venue_id}
                venue={venue}
                onClick={() => navigate("/venue-detail", { state: { venue } })}
              />
            ))}
          </div>
        </section>
      )}

      {/* 🔥 Categories Section */}
      <section className="categories-section">
        <h3 className="dashboard-subtitle">Categories</h3>
        <div className="category-list">
          {categories.map((cat) => (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                backgroundColor: activeCategory === cat ? "#8a2be2" : "#E5E7EB",
                color: activeCategory === cat ? "#FFFFFF" : "#111827",
                transition: { duration: 0.2 },
              }}
              key={cat}
              className="category-btn"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </section>

      {/* 🔥 Main Recommendations Section */}
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
              {loading ? (
                <p>Loading more...</p>
              ) : noMoreData ? (
                <p>🎉 You’ve reached the end!</p>
              ) : null}
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

      <ChatLauncher isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
      <BottomNav />
    </Container>
  );
};

export default Dashboard;