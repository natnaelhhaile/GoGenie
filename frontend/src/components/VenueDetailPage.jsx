import React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa6";
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
  const [rating, setRating] = useState("Loading...");
  const [hours, setHours] = useState(null);
  const [popularity, setPopularity] = useState(null);
  const [stats, setStats] = useState({ total_ratings: 0, total_tips: 0, total_photos: 0 });
  const [openNow, setOpenNow] = useState(null);
  const [tips, setTips] = useState([]);



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

  // useeffect for rating and others
  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/recommendations/details/${venue.venue_id}`);
        setRating(res.data.rating || "No rating available");
        setHours(res.data.hours?.display || null);
        setOpenNow(res.data.hours?.open_now || null);
        setPopularity(res.data.popularity || null);
        setStats(res.data.stats ? res.data.stats : { total_ratings: 0, total_tips: 0, total_photos: 0 });
        setTips(res.data.tips || null);
      } catch (err) {
        console.error("❌ Error fetching venue details:", err.message);
        setRating("N/A");
      }
    };

    if (venue?.venue_id) fetchVenueDetails();
  }, [venue]);



  if (!venue) {
    return <p>Loading venue details...</p>;
  }

  const { name, location, categories, distance, photos = [] } = venue;
  const address = location?.address || "Unknown Address";
  const city = address.split(",").slice(-2, -1)[0]?.trim() || "Unknown City";
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
        <p><span className="label">Address:</span>{address}</p>
        <p><span className="label">Categories:</span>{categories.slice(0, 3)}</p>
        <p><span className="label">Distance:</span>{distance} meters</p>
        <p><span className="label">City:</span>{city}</p>
        <p>
          <span className="label">Rating:</span>
          <span className="rating-value">
            <span className="star-icon">⭐</span>
            {rating}
          </span>
        </p>
        <p>
          <span className="label">Status:</span>
          <span className={openNow ? "open-status open" : "open-status closed"}>
            {openNow ? "✅ Open Now" : "❌ Closed"}
          </span>
        </p>
        <p><span className="label">Popularity:</span> {(popularity * 100).toFixed(0)}%</p>
        <p><span className="label">Stats:</span> {stats.total_ratings} ratings, {stats.total_tips} tips, {stats.total_photos} photos</p>

        <a
          href={fsqWebUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="venue-external-link"
        >
          🔗 View on Foursquare
        </a>
        <div className="icons-row">
          <span><FaThumbsUp className="thumbs-up" /></span>
          <span><FaThumbsDown className="thumbs-down" /></span>
        </div>
      </div>



      <div className="section-title">More Photos</div>
      <div className="gallery-scroll">
        {photos.slice(1).map((src, i) => (
          <img key={i} src={src} alt={`Gallery ${i + 1}`} />
        ))}
      </div>

      <div className="section-title">User Tips</div>
      <div className="reviews-section">
        {tips.length > 0 ? (
          tips.map((tip, index) => (
            <div className="review-card" key={index}>
              <p className="tip-text">"{tip.text}"</p>
              <p className="tip-date">🕒 {new Date(tip.created_at).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p className="no-tips">No tips available yet.</p>
        )}
      </div>


      <div className="section-title">Hours</div>
      <div className="placeholder-box">{hours ? hours : "Hours not available."}</div>

      <button className="update-preferences" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
};

export default VenueDetailPage;