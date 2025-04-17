import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "./Container";
import "./ProfileSetup.css";
import axios from "axios";

const UpdatePreferences = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    hobbies: [],
    foodPreferences: [],
    thematicPreferences: []
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const userId = localStorage.getItem("userId");

  const hobbiesList = ["Music", "Reading", "Sports", "Gaming", "Traveling"];
  const foodList = ["Vegan", "Seafood", "Fast Food", "Desserts"];
  const thematicList = ["Cozy Cafes", "Outdoor Parks", "Live Music", "Fine Dining"];

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/users/preferences/${userId}`);
        const { hobbies, foodPreferences, thematicPreferences } = response.data;
        setProfile({ hobbies, foodPreferences, thematicPreferences });
      } catch (error) {
        console.error("❌ Error fetching preferences:", error);
      }
    };

    fetchPreferences();
  }, [BACKEND_URL, userId]);

  const handleSelect = (type, value) => {
    setProfile((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((item) => item !== value)
        : [...prev[type], value],
    }));
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      const response = await axios.put(`${BACKEND_URL}/api/users/preferences/${userId}`, {
        hobbies: profile.hobbies,
        foodPreferences: profile.foodPreferences,
        thematicPreferences: profile.thematicPreferences,
      });

      console.log("✅ Preferences updated:", response.data);
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Error updating preferences:", error);
    }
  };

  return (
    <Container>
      <motion.div 
        className="profile-setup-container"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? "active" : ""}`}></div>
          <div className={`progress-step ${step >= 2 ? "active" : ""}`}></div>
          <div className={`progress-step ${step >= 3 ? "active" : ""}`}></div>
        </div>

        {step === 1 && (
          <div className="step-content">
            <h2>Update Hobbies</h2>
            <div className="grid-container">
              {hobbiesList.map((hobby) => (
                <button
                  key={hobby}
                  className={`grid-item ${profile.hobbies.includes(hobby) ? "selected" : ""}`}
                  onClick={() => handleSelect("hobbies", hobby)}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2>Update Food Preferences</h2>
            <div className="grid-container">
              {foodList.map((food) => (
                <button
                  key={food}
                  className={`grid-item ${profile.foodPreferences.includes(food) ? "selected" : ""}`}
                  onClick={() => handleSelect("foodPreferences", food)}
                >
                  {food}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h2>Update Thematic Preferences</h2>
            <div className="grid-container">
              {thematicList.map((theme) => (
                <button
                  key={theme}
                  className={`grid-item ${profile.thematicPreferences.includes(theme) ? "selected" : ""}`}
                  onClick={() => handleSelect("thematicPreferences", theme)}
                >
                  {theme}
                </button>
              ))}
            </div>
            <button className="btn" onClick={handleSubmit}>Save Preferences</button>
          </div>
        )}

        <div className="step-buttons">
          {step > 1 && <button className="btn secondary" onClick={handleBack}>Back</button>}
          {step < 3 && <button className="btn" onClick={handleNext}>Next</button>}
        </div>
      </motion.div>
    </Container>
  );
};

export default UpdatePreferences;
