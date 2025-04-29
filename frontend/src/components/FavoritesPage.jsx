import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Container from "../components/Container";
import BottomNav from "../components/BottomNav";
import VenueCard from "../components/VenueCard";
import { useToast } from "../context/ToastContext";
import "./FavoritesPage.css";

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await axiosInstance.get("/api/favorites/list");
        setFavorites(res.data.favorites || []);
      } catch (err) {
        console.error("❌ Error fetching favorites:", err);
        showToast("Couldn't load your favorites.", "error");
      }
    };

    if (user) fetchFavorites();
  }, [user, showToast]);

  const handleRemoveFavorite = async (venue_id) => {
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

      {favorites.length > 0 ? (
        <section className="favorites-section">
          {favorites.map((fav, index) => {
            const venue = fav.venueData;
            if (!venue) return null;

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
          Go explore and <span onClick={() => navigate("/dashboard")}>add some!</span>
        </p>
      )}
      <BottomNav />
    </Container>
  );
};

export default FavoritesPage;