import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "./Container";
import "./ProfileSetup.css";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    nationality: "",
    industry: "",
    hobbies: [],
    foodPreferences: [],
    thematicPreferences: []
  });

  const hobbiesList = ["Music", "Reading", "Sports", "Gaming", "Traveling"];
  const foodList = ["Vegan", "Seafood", "Fast Food", "Desserts"];
  const thematicList = ["Cozy Cafes", "Outdoor Parks", "Live Music", "Fine Dining"];

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSelect = (type, value) => {
    setProfile((prev) => ({
      ...prev,
      [type]: prev[type].includes(value) ? prev[type].filter((item) => item !== value) : [...prev[type], value],
    }));
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Profile Data:", profile);
    navigate("/dashboard");
  };

  return (
    <Container>
      <motion.div 
        className="profile-setup-container"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Progress Indicator */}
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? "active" : ""}`}></div>
          <div className={`progress-step ${step >= 2 ? "active" : ""}`}></div>
          <div className={`progress-step ${step >= 3 ? "active" : ""}`}></div>
          <div className={`progress-step ${step >= 4 ? "active" : ""}`}></div>
        </div>

        {step === 1 && (
          <div className="step-content">
            <h2>Basic Information</h2>
            <input type="text" name="name" placeholder="Your Name" value={profile.name} onChange={handleChange} />
            <input type="number" name="age" placeholder="Your Age" value={profile.age} onChange={handleChange} />
            <select name="gender" value={profile.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input type="text" name="nationality" placeholder="Nationality" value={profile.nationality} onChange={handleChange} />
            <input type="text" name="industry" placeholder="Industry" value={profile.industry} onChange={handleChange} />
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2>Select Your Hobbies</h2>
            <div className="grid-container">
              {hobbiesList.map((hobby) => (
                <button key={hobby} className={`grid-item ${profile.hobbies.includes(hobby) ? "selected" : ""}`} onClick={() => handleSelect("hobbies", hobby)}>
                  {hobby}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h2>Food Preferences</h2>
            <div className="grid-container">
              {foodList.map((food) => (
                <button key={food} className={`grid-item ${profile.foodPreferences.includes(food) ? "selected" : ""}`} onClick={() => handleSelect("foodPreferences", food)}>
                  {food}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content">
            <h2>Thematic Preferences</h2>
            <div className="grid-container">
              {thematicList.map((theme) => (
                <button key={theme} className={`grid-item ${profile.thematicPreferences.includes(theme) ? "selected" : ""}`} onClick={() => handleSelect("thematicPreferences", theme)}>
                  {theme}
                </button>
              ))}
            </div>
            <button className="btn" onClick={handleSubmit}>Save Profile</button>
          </div>
        )}

        <div className="step-buttons">
          {step > 1 && <button className="btn secondary" onClick={handleBack}>Back</button>}
          {step < 4 && <button className="btn" onClick={handleNext}>Next</button>}
        </div>
      </motion.div>
    </Container>
  );
};

export default ProfileSetup;
