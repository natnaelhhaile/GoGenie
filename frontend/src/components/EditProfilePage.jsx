import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Container from "../components/Container";
import { useToast } from "../context/ToastContext";
import {
  isValidName,
  isValidAge,
  isValidTextField,
  isValidAddress,
} from "../utils/validators";
import "./ProfileSetup.css";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [initialFormData, setInitialFormData] = useState(null);
  const [errorNotice, setErrorNotice] = useState("");
  const [geoCoords, setGeoCoords] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    age: "",
    gender: "",
    nationality: "",
    industry: "",
    location: { text: "" },
  });

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "nonBinary", label: "Non-Binary" },
    { value: "preferNot", label: "Prefer Not To Say" },
  ];

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axiosInstance.get("/api/users/preferences");
        const { fname, lname, age, gender, nationality, industry, location } = res.data;

        const updates = {
          fname,
          lname,
          age,
          gender,
          nationality,
          industry,
          location: location || { text: "" },
        };

        setFormData(updates);
        setInitialFormData(updates);

        if (location?.lat && location?.lng) {
          setGeoCoords({ lat: location.lat, lng: location.lng });
        }
      } catch (err) {
        console.error("❌ Failed to load user details", err);
        setErrorNotice("Failed to load your profile. Please try again later.");
      }
    };

    const detectLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          (err) => {
            console.warn("⚠️ Geolocation denied or failed:", err);
            setGeoError("Location detection failed. Please enter your address manually.");
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    };

    if (user) {
      fetchDetails();
      detectLocation();
    }
  }, [user]);

  const handleCancel = () => navigate("/profile");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "location.text") {
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, text: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorNotice("");

    const { fname, lname, age, gender, nationality, industry, location } = formData;

    if (!isValidName(fname)) return setErrorNotice("Invalid first name.");
    if (!isValidName(lname)) return setErrorNotice("Invalid last name.");
    if (!isValidAge(Number(age))) return setErrorNotice("Invalid age.");
    if (!isValidTextField(gender)) return setErrorNotice("Invalid gender value.");
    if (!isValidTextField(nationality)) return setErrorNotice("Invalid nationality.");
    if (!isValidTextField(industry)) return setErrorNotice("Invalid profession/industry.");
    if (!geoCoords && !isValidAddress(location?.text || "")) {
      return setErrorNotice("Provide a full address or allow location access.");
    }

    const unchanged =
      JSON.stringify(formData) === JSON.stringify(initialFormData) &&
      (!geoCoords ||
        (geoCoords.lat === initialFormData?.location?.lat &&
          geoCoords.lng === initialFormData?.location?.lng));

    if (unchanged) {
      showToast("ℹ️ No changes made to profile.", "info");
      return navigate("/profile");
    }

    const payload = {
      ...formData,
      location: geoCoords
        ? { lat: geoCoords.lat, lng: geoCoords.lng, text: location?.text }
        : location?.text
        ? { text: location.text }
        : undefined,
    };

    try {
      await axiosInstance.put("/api/users/details", payload);
      showToast("🎉 Profile updated successfully!", "success");

      // Check if location has changed and regenerate recommendations
      if (geoCoords) {
        const newLocation = { lat: geoCoords.lat, lng: geoCoords.lng };
        const initialLocation = initialFormData.location
          ? { lat: initialFormData.location.lat, lng: initialFormData.location.lng }
          : null;

        if (!initialLocation || newLocation.lat !== initialLocation.lat || newLocation.lng !== initialLocation.lng) {
          // Trigger recommendation generation only if location has changed
          await axiosInstance.get("/api/recommendations/generate-recommendations");
        }
      }

      navigate("/profile");
    } catch (err) {
      console.error("❌ Error updating profile", err);
      setErrorNotice("Failed to update profile. Please try again.");
      showToast("Failed to update profile.", "error");
    }
  };

  return (
    <Container>
      <div className="profile-setup-inner">
        <form ref={formRef} className="step-content" onSubmit={handleSubmit} noValidate>
          <h2>Edit Your Basic Info</h2>
          <p className={errorNotice ? "error-text" : "notice-text"}>
            {errorNotice || "* All fields are required to save changes."}
          </p>

          <input type="text" name="fname" placeholder="First Name" value={formData.fname} onChange={handleChange} required />
          <input type="text" name="lname" placeholder="Last Name" value={formData.lname} onChange={handleChange} required />
          <input type="number" name="age" placeholder="Your Age" value={formData.age} onChange={handleChange} required />

          <Select
            options={genderOptions}
            value={genderOptions.find((opt) => opt.value === formData.gender)}
            onChange={(selected) => setFormData({ ...formData, gender: selected.value })}
            classNamePrefix="react-select"
            placeholder="Select Gender"
            styles={{
              menu: (base) => ({ ...base, zIndex: 999 }),
              control: (base) => ({
                ...base,
                width: "85%",
                textAlign: "left",
                padding: "2px 6px",
              }),
              singleValue: (base) => ({
                ...base,
                textAlign: "left",
              }),
            }}
          />

          <input type="text" name="nationality" placeholder="Nationality" value={formData.nationality} onChange={handleChange} required />
          <input type="text" name="industry" placeholder="Profession" value={formData.industry} onChange={handleChange} required />
          <input
            type="text"
            name="location.text"
            placeholder="Full Address (e.g., 123 Main St, Sacramento, CA)"
            value={formData.location?.text || ""}
            onChange={handleChange}
            required={!geoCoords}
            disabled={!!geoCoords}
          />

          <div className="geo-status">
            {geoCoords ? (
              <p className="geo-success">
                📍 Geocoded location: {geoCoords.lat.toFixed(4)}, {geoCoords.lng.toFixed(4)}
              </p>
            ) : geoError ? (
              <p className="geo-fallback">⚠️ {geoError}</p>
            ) : (
              <p className="geo-waiting">⏳ Trying to detect location...</p>
            )}
          </div>

          <div className="step-buttons">
            <button className="btn secondary" type="button" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default EditProfilePage;