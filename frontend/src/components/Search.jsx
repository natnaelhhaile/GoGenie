import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IoSearch, IoClose } from "react-icons/io5";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import VenueCard from "../components/VenueCard";
import Container from "../components/Container";
import BottomNav from "../components/BottomNav";
import { isValidSearchQuery } from "../utils/validators";
import "./Search.css";

const Search = () => {
  const { user } = useAuth();
  const uid = user?.uid || "guest";
  const storageKey = `recentSearches_${uid}`;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setRecentSearches(stored ? JSON.parse(stored) : []);
  }, [uid]);

  const handleNearby = useCallback(async () => {
    setLoadingNearby(true);
    try {
      const res = await axiosInstance.get("/api/recommendations/nearby");
      const venues = res.data.results || [];
      setResults(venues);

      sessionStorage.setItem(
        "lastSearch",
        JSON.stringify({ type: "nearby", results: venues })
      );

      let updated = ["Near Me", ...recentSearches.filter((t) => t !== "Near Me")];
      if (updated.length > 5) updated = updated.slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));

      showToast("📍 Showing places near you!", "success");
    } catch (err) {
      console.error("Nearby error:", err);
      if (err?.response?.status === 400) {
        showToast("⚠️ Please enable location access to use 'Near Me'.", "error");
      } else {
        showToast("Could not fetch nearby venues.", "error");
      }
    } finally {
      setLoadingNearby(false);
    }
  }, [recentSearches, storageKey, showToast]);

  useEffect(() => {
    const last = sessionStorage.getItem("lastSearch");
    if (last) {
      try {
        const parsed = JSON.parse(last);
        if (parsed.type === "nearby") {
          setResults(parsed.results);
        } else {
          setQuery(parsed.query);
          setResults(parsed.results);
        }
      } catch {
        console.warn("Failed to parse lastSearch from sessionStorage.");
      }
    }
  }, []);

  const handleSearch = useCallback(
    async (termParam) => {
      const term = (termParam ?? query).trim();

      if (!term || !isValidSearchQuery(term)) {
        showToast("⚡ Search must be between 2 and 100 characters.", "info");
        return;
      }

      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `/api/recommendations/search?query=${encodeURIComponent(term)}`
        );
        const venues = res.data.results || [];
        setResults(venues);

        if (venues.length === 0) {
          showToast("😕 No venues found for your search.", "info");
        }

        sessionStorage.setItem(
          "lastSearch",
          JSON.stringify({ query: term, results: venues })
        );

        let updated = [term, ...recentSearches.filter((q) => q !== term)];
        if (updated.length > 5) updated = updated.slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error("Search error:", err);
        showToast("Error while searching.", "error");
      } finally {
        setLoading(false);
      }
    },
    [query, recentSearches, storageKey, showToast]
  );

  return (
    <Container>
      <div className="search-header">
        <IoSearch className="search-icon" />
        <input
          className="search-input"
          placeholder="Search by name, category, or tag..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        {query && (
          <button
            className="clear-btn"
            onClick={() => {
              setQuery("");
              setResults([]);
              sessionStorage.removeItem("lastSearch");
            }}
          >
            <IoClose />
          </button>
        )}
      </div>

      <div className="recent-searches">
        <span className="recent-title">Recent:</span>

        <button className="recent-item" onClick={handleNearby}>
          📍 near me
        </button>

        {recentSearches.map((term, idx) =>
          term === "Near Me" ? null : (
            <button
              key={idx}
              className="recent-item"
              onClick={() => {
                setQuery(term);
                handleSearch(term);
              }}
            >
              {term}
            </button>
          )
        )}

        {recentSearches.filter((t) => t !== "Near Me").length > 0 && (
          <button
            className="clear-recent"
            onClick={() => {
              setRecentSearches([]);
              localStorage.removeItem(storageKey);
              showToast("🧹 Cleared recent searches!", "success");
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="search-results">
        {(loading || loadingNearby) ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Searching...</p>
          </div>
        ) : results.length ? (
          results.map((venue) => (
            <VenueCard
              key={venue.venue_id}
              venue={venue}
              onClick={() => navigate("/venue-detail", { state: { venue } })}
              showFavoriteIcon={false}
            />
          ))
        ) : (
          <p className="no-results-text">🔍 No matching results yet.</p>
        )}
      </div>

      <BottomNav />
    </Container>
  );
};

export default Search;