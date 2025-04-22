import React from "react";
import { IoHeart, IoHeartOutline, IoLocationSharp } from "react-icons/io5";
import "./VenueCard.css";

const VenueCard = ({ venue, isFavorite, onToggleFavorite, onClick, showFavoriteIcon = true }) => {
  const city = venue?.location?.locality || "Unknown City";
  const venueImage = venue?.photos?.[0] || require("../assets/dum1.jpg");

  return (
    <div className="venue-card" onClick={onClick}>
      {showFavoriteIcon && (
        <div
          className="favorite-toggle"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          {isFavorite ? (
            <IoHeart className="favorite-icon active" />
          ) : (
            <IoHeartOutline className="favorite-icon" />
          )}
        </div>
      )}
      <picture>
        <source srcSet={venueImage} type="image/webp" />
        <img src={venueImage} alt={venue.name} />
      </picture>
      <p>{venue.name}</p>
      <div className="location-info">
        <span className="location-pin">
          <IoLocationSharp />
        </span>
        <span className="city-name">{city}</span>
      </div>
    </div>
  );
};

export default VenueCard;