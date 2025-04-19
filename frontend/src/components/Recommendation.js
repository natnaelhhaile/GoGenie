import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import axios from "axios";
import "./Dashboard.css";

const Recommendation = () => {
  const [userPreferences, setUserPreferences] = useState(null);
  // const [message, setMessage] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (user) {
        // setMessage(`${user.displayName || user.email.split("@")[0]}`);
        const userId = user.uid;
        try {
          const token = localStorage.getItem("token");

          const headers = {
            Authorization: `Bearer ${token}`,
          };
          const response = await axios.get(`${BACKEND_URL}/api/users/preferences/${userId}`, {headers});
          setUserPreferences(response.data);
        } catch (error) {
          console.error("❌ Error fetching preferences:", error);
        }
      }
    };
    fetchUserPreferences();
  }, [BACKEND_URL, user]);

  const fetchAIRecommendations = async () => {
    if (!userPreferences) return;
    setLoading(true);
    if (user) {
      const userId = user.uid;
      try {
        console.log("userId", userId);
        const response = await axios.get(`${BACKEND_URL}/api/recommendations/user-venues/${userId}`);

        console.log("✅ AI Response:", response.data);

        if (Array.isArray(response.data.recommendations)) {
          setRecommendations(response.data.recommendations); // ✅ Now handling structured data
        } else {
          console.error("❌ Unexpected response format:", response.data);
        }
      } catch (error) {
        console.error("❌ Error fetching AI recommendations:", error);
      } finally {
        setLoading(false);
      }
    }

  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>🌞 Good Morning, {userPreferences?.name || "User"}!</h2>
      </header>

      {/* <section className="username-section">
        <h3 className="username">{message}</h3>
      </section> */}

      <button onClick={fetchAIRecommendations} className="fetch-recommendations">
        {loading ? "Loading..." : "Get Personalized Recommendations"}
      </button>

      {recommendations.length > 0 && (
        <section className="recommendations-section">
          <h3>Personalized Recommendations</h3>
          <ul className="recommendations-list">
            {recommendations.map((venue, index) => (
              <li key={venue.id || index} className="recommendation-card">
                <h4>{venue.name}</h4>
                <p><strong>Category:</strong> {venue.category}</p>
                <p><strong>Address:</strong> {venue.address}</p>
                <p><strong>Distance:</strong> {venue.distance}</p>
                <a href={venue.link} target="_blank" rel="noopener noreferrer">View on Foursquare</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default Recommendation;
