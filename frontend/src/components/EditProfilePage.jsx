import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Container from "../components/Container";
import { useToast } from "../context/ToastContext";
import "./ProfileSetup.css";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [initialFormData, setInitialFormData] = useState(null);
  const [initialCoords, setInitialCoords] = useState(null);
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
    locationText: "",
  });

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "nonBinary", label: "Non-Binary" },
    { value: "preferNot", label: "Prefer Not To Say" }
  ];

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axiosInstance.get("/api/users/preferences");
        const { fname, lname, age, gender, nationality, industry, location } = res.data;

        const updates = {
          fname, lname, age, gender, nationality, industry,
          locationText: location?.text || "",
        };

        setFormData(updates);
        setInitialFormData(updates);

        if (location?.lat && location?.lng) {
          setGeoCoords({ lat: location.lat, lng: location.lng });
          setInitialCoords({ lat: location.lat, lng: location.lng });
        }
      } catch (err) {
        console.error("❌ Failed to load user details", err);
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
            setGeoError("Location detection failed. You can enter your city manually.");
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

  const handleCancel = () => {
    navigate("/profile");
    return;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      setErrorNotice("Please fill out all required fields correctly.");
      return;
    }

    // Compare formData
    const unchanged =
      JSON.stringify(formData) === JSON.stringify(initialFormData) &&
      JSON.stringify(geoCoords) === JSON.stringify(initialCoords);

    if (unchanged) {
      showToast("ℹ️ No changes made to profile.", "info");
      navigate("/profile");
      return;
    }

    const payload = {
      ...formData,
      location: geoCoords
        ? { lat: geoCoords.lat, lng: geoCoords.lng }
        : formData.locationText
        ? { text: formData.locationText }
        : undefined,
    };

    try {
      await axiosInstance.put("/api/users/details", payload);
      showToast("🎉 Profile updated successfully!", "success");
      navigate("/profile");
    } catch (err) {
      console.error("❌ Error updating profile", err);
      setErrorNotice("Failed to update profile. Please try again.");
    }
  };

  return (
    <Container>
      <div className="profile-setup-inner">
        <form ref={formRef} className="step-content" onSubmit={handleSubmit} noValidate>
          <h2>Edit Your Basic Info</h2>
          <p className={errorNotice ? "error-text" : "notice-text"}>
            * All fields are required to save changes.
          </p>

          <input
            type="text"
            name="fname"
            placeholder="First Name"
            value={formData.fname}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="lname"
            placeholder="Last Name"
            value={formData.lname}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="age"
            placeholder="Your Age"
            value={formData.age}
            onChange={handleChange}
            required
          />

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
                padding: "2px 6px"
              }),
              singleValue: (base) => ({
                ...base,
                textAlign: "left"
              })
            }}
          />

          <input
            type="text"
            name="nationality"
            placeholder="Nationality"
            value={formData.nationality}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="industry"
            placeholder="Profession"
            value={formData.industry}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="locationText"
            placeholder="Location (e.g., San Jose, CA)"
            value={formData.locationText}
            onChange={handleChange}
            required={!geoCoords}
          />
          <div className="geo-status">
            {geoCoords ? (
              <p className="geo-success">
                📍 Location auto-detected: {geoCoords.lat.toFixed(4)}, {geoCoords.lng.toFixed(4)}
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