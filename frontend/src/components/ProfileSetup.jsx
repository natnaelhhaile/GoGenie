import React, { useState, useRef } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "./Container";
import "./ProfileSetup.css";
import axiosInstance from "../api/axiosInstance";
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
    lifestylePreferences: [],
  });
  const [errorNotice, setErrorNotice] = useState("");

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "nonBinary", label: "Non-Binary" },
    { value: "preferNot", label: "Prefer Not To Say" },
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
    if (step === 1 && formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      setErrorNotice("All fields are required to proceed.");
      return;
    }

    if (
      (step === 2 && profile.hobbies.length < 2) ||
      (step === 3 && profile.foodPreferences.length < 2) ||
      (step === 4 && profile.thematicPreferences.length < 2)
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
    if (profile.lifestylePreferences.length < 2) {
      setErrorNotice("Please select at least 2 options to proceed. Recommended: pick 3 or more for better suggestions.");
      return;
    }

    try {
      const res = await axiosInstance.post("/api/users/preferences", profile);
      console.log("✅ Preferences saved:", res.data);
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Error saving preferences:", err);
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
              <Select
                options={genderOptions}
                value={genderOptions.find((opt) => opt.value === profile.gender)}
                onChange={(selected) => setProfile({ ...profile, gender: selected.value })}
                classNamePrefix="react-select"
                placeholder="Select Gender"
                styles={{
                  menu: (base) => ({ ...base, zIndex: 999 }),
                  control: (base) => ({
                    ...base,
                    width: "100%",
                    textAlign: "left",
                    padding: "2px 6px",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    textAlign: "left",
                  }),
                }}
              />
              <input type="text" name="nationality" placeholder="Nationality" value={profile.nationality} onChange={handleChange} required />
              <input type="text" name="industry" placeholder="Industry" value={profile.industry} onChange={handleChange} required />
              <input type="text" name="location" placeholder="Location (city, CA)" value={profile.location} onChange={handleChange} required />
            </div>
          </form>
        )}

        {[2, 3, 4, 5].includes(step) && (
          <div className="step-content">
            <div className="sticky-header">
              <h2>
                {step === 2
                  ? "Select Your Hobbies"
                  : step === 3
                  ? "Food Preferences"
                  : step === 4
                  ? "Thematic Preferences"
                  : "Lifestyle Preferences"}
              </h2>
              <p className={errorNotice ? "error-text" : "notice-text"}>
                * Select at least 2 options to proceed. Recommended: pick 3+ for better suggestions.
              </p>
            </div>
            <div className="scrollable-grid-wrapper">
              <div className="grid-container">
                {(step === 2
                  ? hobbiesList
                  : step === 3
                  ? foodList
                  : step === 4
                  ? thematicList
                  : lifestyleList
                ).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`grid-item ${
                      profile[
                        step === 2
                          ? "hobbies"
                          : step === 3
                          ? "foodPreferences"
                          : step === 4
                          ? "thematicPreferences"
                          : "lifestylePreferences"
                      ].includes(item)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleSelect(
                        step === 2
                          ? "hobbies"
                          : step === 3
                          ? "foodPreferences"
                          : step === 4
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
          {step > 1 && (
            <button className="btn secondary" onClick={handleBack}>
              Back
            </button>
          )}
          {step < 5 ? (
            <button className="btn" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button className="btn" onClick={handleSubmit}>
              Save Profile
            </button>
          )}
        </div>
      </motion.div>
    </Container>
  );
};

export default ProfileSetup;
