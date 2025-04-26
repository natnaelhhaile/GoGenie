import React from "react";
import { IoHeart, IoHeartOutline, IoLocationSharp } from "react-icons/io5";
import "./VenueCard.css";

const VenueCard = ({ venue, isFavorite, onToggleFavorite, onClick, showFavoriteIcon = true }) => {
  const venueImage = venue?.photos?.[0] || require("../assets/no-image.jpg");
  const distanceMiles = venue?.distance ? (venue.distance / 1609.344).toFixed(1) : null;

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
        <img src={venueImage} alt={venue?.name || "Venue"} loading="lazy" />
      </picture>

      <p>{venue?.name || "Unknown Venue"}</p>

      <span>
        <IoLocationSharp className="location-pin" />
        {distanceMiles ? ` ${distanceMiles} mi` : ""}
      </span>
    </div>
  );
};

export default VenueCard;