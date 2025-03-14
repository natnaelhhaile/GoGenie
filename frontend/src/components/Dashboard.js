import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import axios from "axios";

const Dashboard = () => {
  const [userPreferences, setUserPreferences] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const user = auth.currentUser;
      if (user) {
        setMessage(`Welcome, ${user.displayName ? user.displayName : user.email}!`);
        const userId = user.uid; // Get Firebase user ID

        try {
          // ✅ Fetch user preferences from the backend
          const response = await axios.get(`http://localhost:5000/api/users/preferences/${userId}`);
          setUserPreferences(response.data);
        } catch (error) {
          console.error("❌ Error fetching preferences:", error);
        }
      }
    };

    fetchUserPreferences();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>{message}</p>

      {userPreferences ? (
        <div>
          <h3>Your Preferences</h3>
          <p><strong>Age:</strong> {userPreferences.age}</p>
          <p><strong>Gender:</strong> {userPreferences.gender}</p>
          <p><strong>Nationality:</strong> {userPreferences.nationality}</p>
          <p><strong>Industry:</strong> {userPreferences.industry}</p>

          <h4>Hobbies</h4>
          <ul>
            {userPreferences.hobbies.map((hobby, index) => (
              <li key={index}>{hobby}</li>
            ))}
          </ul>

          <h4>Food Preferences</h4>
          <ul>
            {userPreferences.foodPreferences.map((food, index) => (
              <li key={index}>{food}</li>
            ))}
          </ul>

          <h4>Thematic Preferences</h4>
          <ul>
            {userPreferences.thematicPreferences.map((theme, index) => (
              <li key={index}>{theme}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Loading preferences...</p>
      )}
    </div>
  );
};

export default Dashboard;
