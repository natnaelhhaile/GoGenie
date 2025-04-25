import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IoSearch, IoClose } from "react-icons/io5";
import axiosInstance from "../api/axiosInstance";
import VenueCard from "../components/VenueCard";
import Container from "../components/Container";
import BottomNav from "../components/BottomNav";
import "./Search.css";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [recentSearches, setRecentSearches] = useState(() => {
    const stored = localStorage.getItem("recentSearches");
    return stored ? JSON.parse(stored) : [];
  });

  const navigate = useNavigate();

  // Restore last search on mount
  useEffect(() => {
    const last = sessionStorage.getItem("lastSearch");
    if (last) {
      try {
        const { query: lastQuery, results: lastResults } = JSON.parse(last);
        setQuery(lastQuery);
        setResults(lastResults);
      } catch {}
    }
  }, []);

  const handleSearch = useCallback(
    async (termParam) => {
      const term = (termParam !== undefined ? termParam : query).trim();
      if (!term) return;

      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `/api/recommendations/search?query=${encodeURIComponent(term)}`
        );
        const venues = res.data.results || [];
        setResults(venues);

        // persist in sessionStorage
        sessionStorage.setItem(
          "lastSearch",
          JSON.stringify({ query: term, results: venues })
        );

        // update recent searches
        let updated = [term, ...recentSearches.filter(q => q !== term)];
        if (updated.length > 5) updated = updated.slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    },
    [query, recentSearches]
  );

  return (
    <Container>
      <div className="search-header">
        <IoSearch className="search-icon" />
        <input
          className="search-input"
          placeholder="Search by name, category, or tag..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
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

      {recentSearches.length > 0 && (
        <div className="recent-searches">
          <span className="recent-title">Recent:</span>
          {recentSearches.map((term, idx) => (
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
          ))}
          <button
            className="clear-recent"
            onClick={() => {
              setRecentSearches([]);
              localStorage.removeItem("recentSearches");
            }}
          >
            Clear
          </button>
        </div>
      )}

      <div className="search-results">
        {loading ? (
          <p>Searching...</p>
        ) : results.length ? (
          results.map(venue => (
            <VenueCard
              key={venue.venue_id}
              venue={venue}
              onClick={() =>
                navigate("/venue-detail", { state: { venue } })
              }
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