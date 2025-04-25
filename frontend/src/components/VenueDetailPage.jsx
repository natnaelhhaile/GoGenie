import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa6";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import "./VenueDetailPage.css";
import BottomNav from "../components/BottomNav";
import Container from "./Container";
import ChatLauncher from "../components/ChatLauncher";



const VenueDetailPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const venue = state?.venue;
  if (!venue) {
    navigate("/dashboard");
  }
  const { user } = useAuth();

  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState("Loading...");
  const [hours, setHours] = useState(null);
  const [openNow, setOpenNow] = useState(null);
  const [popularity, setPopularity] = useState(null);
  const [stats, setStats] = useState({ total_ratings: 0, total_tips: 0, total_photos: 0 });
  const [tips, setTips] = useState([]);

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fallbackImage = require("../assets/dum1.jpg");

  const address = venue?.location?.formattedAdress || 
                `${venue?.location?.address}, ${venue.location.locality}, ${venue.location.region} ${venue.location.postcode}` || 
                "Unknown Address";
  const distanceMiles = venue.distance * 0.000621371;
  const fsqWebUrl = `https://foursquare.com/v/${venue?.name.replace(/\s+/g, "-").toLowerCase()}/${venue?.venue_id}`;
  const photos = venue?.photos || [];

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !venue?.venue_id) return;
      try {
        const res = await axiosInstance.get("/api/favorites/is-favorite", {
          params: { venue_id: venue.venue_id }
        });
        setIsFavorite(res.data.isFavorite);
      } catch (err) {
        console.error("Error checking favorite:", err);
      }
    };

    checkFavorite();
  }, [venue, user]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axiosInstance.get(`/api/recommendations/details/${venue.venue_id}`);
        setRating(res.data.rating || "No rating available");
        setHours(res.data.hours?.display || null);
        setOpenNow(res.data.hours?.open_now || null);
        setPopularity(res.data.popularity || null);
        setStats(res.data.stats || { total_ratings: 0, total_tips: 0, total_photos: 0 });
        setTips(res.data.tips || []);
      } catch (err) {
        console.error("Error fetching details:", err);
        setRating("N/A");
      }
    };

    if (venue?.venue_id) fetchDetails();
  }, [venue]);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!user || !venue?.venue_id) return;
      try {
        const res = await axiosInstance.get(`/api/feedback/${venue.venue_id}`);
        if (res.data.feedback === "up") setLiked(true);
        else if (res.data.feedback === "down") setDisliked(true);
      } catch (err) {
        console.error("Error fetching previous feedback:", err);
      }
    };
  
    fetchFeedback();
  }, [venue, user]);  

  const handleToggleFavorite = async () => {
    if (!user) return alert("Please log in");

    const payload = {
      venue_id: venue.venue_id
    };

    try {
      if (isFavorite) {
        await axiosInstance.post("/api/favorites/remove", payload);
        setIsFavorite(false);
      } else {
        await axiosInstance.post("/api/favorites/add", payload);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const handleLike = async () => {
    if (!user) return alert("Please log in");
  
    const isActivating = !liked;
    setLiked(isActivating);
    if (disliked) setDisliked(false);
  
    try {
      await axiosInstance.post("/api/feedback", {
        venue_id: venue.venue_id,
        feedback: isActivating ? "up" : "none" // treat unliking as neutral feedback
      });
    } catch (err) {
      console.error("Error sending like feedback:", err);
    }
  };
  
  const handleDislike = async () => {
    if (!user) return alert("Please log in");
  
    const isActivating = !disliked;
    setDisliked(isActivating);
    if (liked) setLiked(false);
  
    try {
      await axiosInstance.post("/api/feedback", {
        venue_id: venue.venue_id,
        feedback: isActivating ? "down" : "none" // treat undisliking as neutral feedback
      });
    } catch (err) {
      console.error("Error sending dislike feedback:", err);
    }
  };  

  if (!venue) return <p>Loading venue details...</p>;

  return (
    <Container>
      <div className="venue-detail-container">
        <img src={photos[0] || fallbackImage} alt={venue.name} className="hero-image" />

        <div className="venue-header">
          <h2 className="venue-name">{venue.name}</h2>
          <button onClick={handleToggleFavorite} className="favorite-button">
            {isFavorite ? <IoHeart className="favorite-icon active" /> : <IoHeartOutline className="favorite-icon" />}
          </button>
        </div>

        <div className="venue-info">
          <p><span className="label">Address:</span> {address}</p>
          <p><span className="label">Categories:</span> {venue.categories?.slice(0, 5).join(", ")}</p>
          <p><span className="label">Distance:</span> {(distanceMiles).toFixed(1) || "?"} miles</p>
          <p><span className="label">City:</span> {venue.location?.locality || "Unknown City"}</p>
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
          <p><span className="label">Popularity:</span> {popularity ? `${(popularity * 100).toFixed(0)}%` : "N/A"}</p>
          <p>
            <span className="label">Stats:</span>
            {stats.total_ratings} ratings, {stats.total_tips} tips, {stats.total_photos} photos
          </p>

          <a href={fsqWebUrl} target="_blank" rel="noopener noreferrer" className="venue-external-link">
            🔗 View on Foursquare
          </a>

          <div className="icons-row">
            <FaThumbsUp
              className={`thumb-icon ${liked ? "active" : ""}`}
              onClick={handleLike}
              title="Like"
            />
            <FaThumbsDown
              className={`thumb-icon ${disliked ? "active" : ""}`}
              onClick={handleDislike}
              title="Dislike"
            />
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
        <div className="placeholder-box">{hours || "Hours not available."}</div>

        <ChatLauncher isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
        <BottomNav />
        
      </div>
    </Container>
  );
};

export default VenueDetailPage;
