import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "./Container";
import "./ProfileSetup.css";
import axios from "axios";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    fname: "",
    lname: "",
    age: "",
    gender: "",
    nationality: "",
    industry: "",
    location: "",
    hobbies: [],
    foodPreferences: [],
    thematicPreferences: [],
    lifestylePreferences: []
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const hobbiesList = [
    "Reading Fiction or Non-Fiction",
    "Hiking & Nature Walks",
    "Watching Movies or Series",
    "Playing Video Games",
    "Attending Live Music Events",
    "Practicing Yoga or Meditation",
    "Photography",
    "Painting or Drawing",
    "Playing Sports (e.g., soccer, tennis)",
    "Cooking or Baking",
    "Dancing",
    "Writing or Journaling",
    "DIY & Crafting",
    "Traveling & Exploring New Places",
    "Learning Languages",
    "Board Games or Puzzles",
    "Volunteering or Community Events",
    "Fashion & Styling",
    "Gardening"
  ];
  const foodList = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Halal",
    "Kosher",
    "Keto / Low Carb",
    "Organic / Farm-to-Table",
    "Spicy Food Lover",
    "Seafood Lover",
    "Dessert Lover",
    "Asian Cuisine (Chinese, Japanese, Thai)",
    "Middle Eastern Cuisine",
    "African Cuisine",
    "Latin American Cuisine",
    "Indian Cuisine",
    "Fast Food Fan",
    "Coffee Addict",
    "Bubble Tea Lover",
    "Street Food Enthusiast"
  ];
  const thematicList = [
    "Cozy / Quiet Places",
    "Artistic / Creative Spaces",
    "Bookstore Cafes",
    "Historical / Culturally Rich Locations",
    "Nature / Scenic Spots",
    "Modern & Trendy Spots",
    "Tech-Friendly Cafes (with Wi-Fi & outlets)",
    "LGBTQ+ Friendly",
    "Live Music & Jam Nights",
    "Family-Friendly",
    "Study-Friendly",
    "Rooftop or Outdoor Seating",
    "Instagrammable Spots",
    "Pet-Friendly Venues",
    "Karaoke or Game Nights",
    "Dance or Music Events",
    "International Cuisine Hotspots",
    "Local Hidden Gems"
  ];
  const lifestyleList = [
    "College Student",
    "Working Professional",
    "Parents with Kids",
    "Solo Explorer",
    "Young Adults (18–25)",
    "Adults (26–40)",
    "Seniors",
    "Digital Nomad",
    "Couple-Friendly Spots",
    "Group Hangouts",
    "First-Date Ideas",
    "Budget-Friendly",
    "Luxury / Upscale"
  ];

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSelect = (type, value) => {
    setProfile((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((item) => item !== value)
        : [...prev[type], value],
    }));
  };

  const handleNext = () => {
    if (step === 1 && formRef.current) {
      if (!formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/preferences`, {
        userId,
        ...profile
      });
      console.log("Preferences saved:", response.data);
      navigate("/recommendation");
    } catch (error) {
      console.error("Error saving preferences:", error.response?.data || error);
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
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`progress-step ${step >= i ? "active" : ""}`} />
          ))}
        </div>

        {step === 1 && (
          <form ref={formRef} noValidate>
            <div className="step-content">
              <h2>Basic Information</h2>
              <input type="text" name="fname" placeholder="First Name" value={profile.fname} onChange={handleChange} required />
              <input type="text" name="lname" placeholder="Last Name" value={profile.lname} onChange={handleChange} required />
              <input type="number" name="age" placeholder="Your Age" value={profile.age} onChange={handleChange} required />
              <select name="gender" value={profile.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="nonBinary">Non-Binary</option>
                <option value="preferNot">Prefer Not To Say</option>
              </select>
              <input type="text" name="nationality" placeholder="Nationality" value={profile.nationality} onChange={handleChange} required />
              <input type="text" name="industry" placeholder="Industry" value={profile.industry} onChange={handleChange} required />
              <input type="text" name="location" placeholder="Location (city, CA)" value={profile.location} onChange={handleChange} required />
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2>Select Your Hobbies</h2>
            <div className="grid-container">
              {hobbiesList.map((hobby) => (
                <button key={hobby} type="button" className={`grid-item ${profile.hobbies.includes(hobby) ? "selected" : ""}`} onClick={() => handleSelect("hobbies", hobby)}>
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
                <button key={food} type="button" className={`grid-item ${profile.foodPreferences.includes(food) ? "selected" : ""}`} onClick={() => handleSelect("foodPreferences", food)}>
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
                <button key={theme} type="button" className={`grid-item ${profile.thematicPreferences.includes(theme) ? "selected" : ""}`} onClick={() => handleSelect("thematicPreferences", theme)}>
                  {theme}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="step-content">
            <h2>Lifestyle Preferences</h2>
            <div className="grid-container">
              {lifestyleList.map((lifestyle) => (
                <button key={lifestyle} type="button" className={`grid-item ${profile.lifestylePreferences.includes(lifestyle) ? "selected" : ""}`} onClick={() => handleSelect("lifestylePreferences", lifestyle)}>
                  {lifestyle}
                </button>
              ))}
            </div>
            <button className="btn" onClick={handleSubmit}>Save Profile</button>
          </div>
        )}

        <div className="step-buttons">
          {step > 1 && <button className="btn secondary" onClick={handleBack}>Back</button>}
          {step < 5 && <button className="btn" onClick={handleNext}>Next</button>}
        </div>
      </motion.div>
    </Container>
  );
};

export default ProfileSetup;
