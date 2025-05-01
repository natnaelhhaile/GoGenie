import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Container from "../components/Container";
import BottomNav from "../components/BottomNav";
import VenueCard from "../components/VenueCard";
import { useToast } from "../context/ToastContext";
import "./FavoritesPage.css";
import { isValidVenueId } from "../utils/validators";

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        const res = await axiosInstance.get("/api/favorites/list");
        setFavorites(res.data.favorites || []);
        setFetchError(false);
      } catch (err) {
        console.error("❌ Error fetching favorites:", err);
        setFetchError(true);
        showToast("Couldn't load your favorites.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchFavorites();
  }, [user, showToast]);

  const handleRemoveFavorite = async (venue_id) => {
    if (!isValidVenueId(venue_id)) {
      showToast("Invalid venue ID", "error");
      return;
    }

    try {
      await axiosInstance.post("/api/favorites/remove", { venue_id });
      setFavorites((prev) => prev.filter((f) => f.venue_id !== venue_id));
      showToast("💔 Removed from favorites", "success");
    } catch (err) {
      console.error("❌ Error removing favorite:", err);
      showToast("Failed to remove favorite", "error");
    }
  };

  return (
    <Container>
      <header className="favorites-header">
        <span>Your Favorite Places</span>
      </header>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"/>
          <p>Loading your favorites...</p>
        </div>
      ) : fetchError ? (
        <p className="error-text">
          Something went wrong while fetching your favorites. Please try again later.
        </p>
      ) : favorites.length > 0 ? (
        <section className="favorites-section">
          {favorites.map((fav, index) => {
            const venue = fav.venueData;
            if (!venue || !venue.venue_id) return null;

            return (
              <VenueCard
                key={venue.venue_id || index}
                venue={venue}
                isFavorite={true}
                onToggleFavorite={() => handleRemoveFavorite(venue.venue_id)}
                onClick={() => navigate("/venue-detail", { state: { venue } })}
                showFavoriteIcon
              />
            );
          })}
        </section>
      ) : (
        <p className="no-results-text">
          You haven't added any favorites yet.
          <br />
          Go explore and{" "}
          <span onClick={() => navigate("/dashboard")} style={{ cursor: "pointer", color: "#3b82f6" }}>
            add some!
          </span>
        </p>
      )}
      <BottomNav />
    </Container>
  );
};

export default FavoritesPage;