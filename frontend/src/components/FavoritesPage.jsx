import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { IoLocationSharp, IoHeart, IoHeartOutline } from "react-icons/io5";
import Container from "../components/Container";
import "./FavoritesPage.css";

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchFavorites = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const response = await axios.get(`${BACKEND_URL}/api/favorites/list/${user.uid}`);
        // console.log("Fetched favorites:", response.data.favorites);
        setFavorites(response.data.favorites);
      } catch (error) {
        console.error("❌ Error fetching favorites:", error);
      }
    };

    fetchFavorites();
  }, [BACKEND_URL]);

  const handleRemoveFavorite = async (venueId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
  
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/favorites/remove`, {
        userId: currentUser.uid,
        venueId,
      });
  
      // ✅ Immediately update local state
      setFavorites(prev => prev.filter(v => v.venueData.venue_id !== venueId));
    } catch (error) {
      console.error("❌ Error removing favorite:", error);
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
  const isThisFavorite = true; // Because you're loading only favorites on this page

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
      <span><IoLocationSharp className="clock-icon" /> {city}</span>

      {/* ✅ Toggle Heart Icon */}
      {isThisFavorite ? (
        <IoHeart
          className="heart-icon active"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveFavorite(venue.venue_id);
          }}
        />
      ) : (
        <IoHeartOutline
          className="heart-icon"
          onClick={(e) => {
            e.stopPropagation();
           
          }}
        />
      )}
    </div>
  );
})}

        </section>
      ) : (
        <p>You haven't added any favorites yet.</p>
      )}
    </Container>
  );
};

export default FavoritesPage;
