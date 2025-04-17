import React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import axios from "axios";
// import { IoLocationSharp } from "react-icons/io5";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import "./VenueDetailPage.css";



const VenueDetailPage = () => {
  const { state } = useLocation();
  const venue = state?.venue;
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false); // Toggle save

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const user = auth.currentUser;
      if (user && venue?.venue_id) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/api/favorites/is-favorite`,
            {
              params: {
                userId: user.uid,
                venueId: venue.venue_id,
              },
            }
          );
          console.log("✅ Favorite status:", response.data.isFavorite);
          setIsFavorite(response.data.isFavorite);
        } catch (error) {
          console.error("❌ Error checking favorite status:", error);
        }
      }
    };

    checkFavoriteStatus();
  }, [venue]);
  

  if (!venue) {
    return <p>Loading venue details...</p>;
  }

  const { name, location, category, distance, photos = [] } = venue;
  const address = location?.address || "Unknown Address";
  const city = address.split(",").slice(-2, -1)[0]?.trim() || "Unknown City";
  const rating = venue.rating || "No rating available";
  const fsqWebUrl = `https://foursquare.com/v/${venue.name.replace(/\s+/g, "-").toLowerCase()}/${venue.venue_id}`;

  // Local fallback photo
  const fallbackImage = require(`../assets/dum1.jpg`);


  // handles favorite toggle
  const handleToggleFavorite = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return alert("Please log in");
  
    const payload = {
      userId: currentUser.uid,
      venueId: venue.venue_id,
      venueData: venue
    };
  
    try {
      if (isFavorite) {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/favorites/remove`, payload);
        setIsFavorite(false);
      } else {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/favorites/add`, {
          ...payload,
          venueData: venue
        });
        setIsFavorite(true);
      }
      } catch (error) {
      console.error("❌ Error saving favorite:", error);
    }
  };

  return (
    <div className="venue-detail-container">

      <img
        src={photos[0] || fallbackImage} // Fallback to a default image if none available
        alt={name}
        className="hero-image"
      />


      <div className="venue-header">
        <h2 className="venue-name">{name}</h2>
        <button onClick={handleToggleFavorite} className="favorite-button">
          {isFavorite ? <IoHeart className="favorite-icon active" /> : <IoHeartOutline className="favorite-icon" />}
        </button>
      </div>

      <div className="venue-info">
        <p><span className="label">Address:</span> {address}</p>
        <p><span className="label">Category:</span> {category}</p>
        <p><span className="label">Distance:</span> {distance} meters</p>
        <p><span className="label">City:</span> {city}</p>
        <p><span className="label">Rating:</span> ⭐ {rating}</p>
        <a href={fsqWebUrl} target="_blank" rel="noopener noreferrer" className="external-link">🔗 View on Foursquare</a>
      </div>


      <div className="section-title">More Photos</div>
      <div className="gallery-scroll">
        {photos.slice(1).map((src, i) => (
          <img key={i} src={src} alt={`Gallery ${i + 1}`} />
        ))}
      </div>

      <div className="section-title">User Reviews</div>
      <div className="reviews-section">
        <div className="review-card">
          <p><strong>Amy L.</strong> ⭐⭐⭐⭐⭐</p>
          <p>"Awesome place, great vibes and even better food!"</p>
        </div>
        <div className="review-card">
          <p><strong>John D.</strong> ⭐⭐⭐⭐</p>
          <p>"Clean, cozy, and staff were friendly. Worth it."</p>
        </div>
      </div>

      <div className="section-title">Hours</div>
      <div className="placeholder-box">Open daily from 9:00 AM to 10:00 PM</div>

      <button className="update-preferences" onClick={() => navigate(-1)}>⬅ Go Back</button>
    </div>
  );
};

export default VenueDetailPage;