import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { IoLocationSharp, IoHeart } from "react-icons/io5";
import Container from "../components/Container";
import "./FavoritesPage.css";
import BottomNav from "../components/BottomNav";


const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await axiosInstance.get("/api/favorites/list");
        setFavorites(res.data.favorites || []);
      } catch (err) {
        console.error("❌ Error fetching favorites:", err);
      }
    };

    if (user) fetchFavorites();
  }, [user]);

  const handleRemoveFavorite = async (venueId) => {
    try {
      await axiosInstance.post("/api/favorites/remove", { venueId });
      setFavorites((prev) => prev.filter((f) => f.venueData.venue_id !== venueId));
    } catch (err) {
      console.error("❌ Error removing favorite:", err);
    }
  };

  return (
    <Container>
      <h2 className="favorites-header">Your Favorite Places</h2>

      {favorites.length > 0 ? (
        <section className="favorites-section">
          {favorites.map((fav, index) => {
            const venue = fav.venueData;
            const addressParts = venue.location?.address?.split(",") || [];
            const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : "Unknown City";

            return (
              <div
                key={venue.venue_id || index}
                className="favorite-card"
                onClick={(e) => {
                  if (e.target.closest(".heart-icon")) return;
                  navigate("/venue-detail", { state: { venue } });
                }}
              >
                <img src={venue.photos?.[0]} alt={venue.name} />
                <p>{venue.name}</p>
                <span>
                  <IoLocationSharp className="clock-icon" /> {city}
                </span>

                <IoHeart
                  className="heart-icon active"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFavorite(venue.venue_id);
                  }}
                />
              </div>
            );
          })}
        </section>
      ) : (
        <p>You haven't added any favorites yet.</p>
      )}
      <BottomNav />
      
    </Container>
  );
};

export default FavoritesPage;