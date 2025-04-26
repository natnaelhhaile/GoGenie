import React from "react";
import { IoLocationSharp } from "react-icons/io5";
import "./FeaturedCard.css";

export default function FeaturedCard({ venue, onClick }) {
  const imgUrl = (venue?.photos?.[0]) || require("../assets/no-image.jpg");
  const distanceMiles = venue?.distance ? (venue.distance / 1609.344).toFixed(1) : null;

  return (
    <div className="featured-item" onClick={onClick}>
      <picture>
        <source srcSet={imgUrl} type="image/webp" />
        <img src={imgUrl} alt={venue?.name || "Venue"} loading="lazy" />
      </picture>

      <p>{venue?.name || "Unknown Venue"}</p>

      <span>
        <IoLocationSharp className="location-pin" />
        {distanceMiles ? ` ${distanceMiles} mi` : ""}
      </span>
    </div>
  );
}