import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "./Container";
import "./ProfileSetup.css";
import axios from "axios";
import { hobbiesList, foodList, thematicList, lifestyleList } from "../constants/preferencesData";

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
  const [errorNotice, setErrorNotice] = useState("");
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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
        setErrorNotice("All fields are required to proceed.");
        return;
      }
    }

    if (
      (step === 2 && profile.hobbies.length < 2) ||
      (step === 3 && profile.foodPreferences.length < 2) ||
      (step === 4 && profile.thematicPreferences.length < 2) ||
      (step === 5 && profile.lifestylePreferences.length < 2)
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");
    try {
      // ✅ Get Firebase token
      const token = localStorage.getItem("token");
  
      const headers = {
        Authorization: `Bearer ${token}`,
      };
  
      const response = await axios.post(
        `${BACKEND_URL}/api/users/preferences`,
        { userId, ...profile },
        { headers }
      );
      
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
              <p className={errorNotice ? "error-text" : "notice-text"}>* All fields are required to proceed.</p>
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

        {[2, 3, 4, 5].includes(step) && (
          <div className="step-content">
            <h2>
              {step === 2 ? "Select Your Hobbies" :
               step === 3 ? "Food Preferences" :
               step === 4 ? "Thematic Preferences" :
               "Lifestyle Preferences"}
            </h2>
            <p className={errorNotice ? "error-text" : "notice-text"}>* Select at least 2 options to proceed. Recommended: pick 3+ for better suggestions.</p>
            <div className="grid-container">
              {(step === 2 ? hobbiesList :
                step === 3 ? foodList :
                step === 4 ? thematicList :
                lifestyleList).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`grid-item ${profile[step === 2 ? "hobbies" : step === 3 ? "foodPreferences" : step === 4 ? "thematicPreferences" : "lifestylePreferences"].includes(item) ? "selected" : ""}`}
                  onClick={() => handleSelect(step === 2 ? "hobbies" : step === 3 ? "foodPreferences" : step === 4 ? "thematicPreferences" : "lifestylePreferences", item)}
                >
                  {item}
                </button>
              ))}
            </div>
            {step === 5 && (
              <button className="btn" onClick={handleSubmit}>Save Profile</button>
            )}
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
