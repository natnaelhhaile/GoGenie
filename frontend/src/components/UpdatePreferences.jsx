import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "./Container";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import {
  hobbiesList,
  foodList,
  thematicList,
  lifestyleList
} from "../constants/preferencesData";
import "./ProfileSetup.css";

const UpdatePreferences = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [errorNotice, setErrorNotice] = useState("");

  const [profile, setProfile] = useState({
    hobbies: [],
    foodPreferences: [],
    thematicPreferences: [],
    lifestylePreferences: []
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await axiosInstance.get("/api/users/preferences");
        const {
          hobbies = [],
          foodPreferences = [],
          thematicPreferences = [],
          lifestylePreferences = []
        } = res.data;
        setProfile({ hobbies, foodPreferences, thematicPreferences, lifestylePreferences });
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
        : [...prev[type], value]
    }));
  };

  const handleNext = () => {
    if (
      (step === 1 && profile.hobbies.length < 2) ||
      (step === 2 && profile.foodPreferences.length < 2) ||
      (step === 3 && profile.thematicPreferences.length < 2)
    ) {
      setErrorNotice("Please select at least 2 options to proceed. Recommended: pick 3 or more for better suggestions.");
      return;
    }

    setErrorNotice("");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrorNotice("");
    setStep((prev) => prev - 1);
  };

  const handleCancel = () => {
    navigate("/profile");
    return;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profile.lifestylePreferences.length < 2) {
      setErrorNotice("Please select at least 2 options to proceed. Recommended: pick 3 or more for better suggestions.");
      return;
    }

    try {
      await axiosInstance.put("/api/users/preferences", profile);
      console.log("✅ Preferences updated");
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Error updating preferences:", err);
    }
  };

  return (
    <Container>
      <motion.div
        className="profile-setup-inner"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="progress-bar">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`progress-step ${step >= i ? "active" : ""}`} />
          ))}
        </div>

        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          {step >= 1 && (
            <div className="step-content">
              <div className="sticky-header">
                <h2>
                  {step === 1
                    ? "Update Hobbies"
                    : step === 2
                    ? "Update Food Preferences"
                    : step === 3
                    ? "Update Thematic Preferences"
                    : "Update Lifestyle Preferences"}
                </h2>
                <p className={errorNotice ? "error-text" : "notice-text"}>
                  * Select at least 2 options to proceed. Recommended: pick 3+ for better suggestions.
                </p>
              </div>
              <div className="scrollable-grid-wrapper">
                <div className="grid-container">
                  {(step === 1
                    ? hobbiesList
                    : step === 2
                    ? foodList
                    : step === 3
                    ? thematicList
                    : lifestyleList
                  ).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`grid-item ${
                        profile[
                          step === 1
                            ? "hobbies"
                            : step === 2
                            ? "foodPreferences"
                            : step === 3
                            ? "thematicPreferences"
                            : "lifestylePreferences"
                        ].includes(item)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleSelect(
                          step === 1
                            ? "hobbies"
                            : step === 2
                            ? "foodPreferences"
                            : step === 3
                            ? "thematicPreferences"
                            : "lifestylePreferences",
                          item
                        )
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="step-buttons">
          {step === 1 && (
            <button type="button" className="btn secondary" onClick={handleCancel}>
              Cancel
            </button>
          )}
            {step > 1 && (
              <button type="button" className="btn secondary" onClick={handleBack}>
                Back
              </button>
            )}
            {step < 4 ? (
              <button type="button" className="btn" onClick={handleNext}>
                Next
              </button>
            ) : (
              <button type="submit" className="btn">
                Save Preferences
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </Container>
  );
};

export default UpdatePreferences;