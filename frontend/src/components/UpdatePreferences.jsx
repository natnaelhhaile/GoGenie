import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "./Container";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import "./ProfileSetup.css";

const UpdatePreferences = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    hobbies: [],
    foodPreferences: [],
    thematicPreferences: []
  });

  const hobbiesList = ["Music", "Reading", "Sports", "Gaming", "Traveling"];
  const foodList = ["Vegan", "Seafood", "Fast Food", "Desserts"];
  const thematicList = ["Cozy Cafes", "Outdoor Parks", "Live Music", "Fine Dining"];

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await axiosInstance.get("/api/users/preferences");
        const { hobbies, foodPreferences, thematicPreferences } = res.data;
        setProfile({ hobbies, foodPreferences, thematicPreferences });
      } catch (err) {
        console.error("❌ Error fetching preferences:", err);
      }
    };

    if (user) fetchPreferences();
  }, [user]);

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
      const res = await axiosInstance.put("/api/users/preferences", {
        hobbies: profile.hobbies,
        foodPreferences: profile.foodPreferences,
        thematicPreferences: profile.thematicPreferences,
      });
      console.log("✅ Preferences updated:", res.data);
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Error updating preferences:", err);
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
          {step > 1 && (
            <button className="btn secondary" onClick={handleBack}>
              Back
            </button>
          )}
          {step < 3 && (
            <button className="btn" onClick={handleNext}>
              Next
            </button>
          )}
        </div>
      </motion.div>
    </Container>
  );
};

export default UpdatePreferences;