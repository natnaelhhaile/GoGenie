import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Container from "../components/Container";
import "./ProfileSetup.css"; // Reusing unified styling

const EditProfilePage = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { user } = useAuth();

  const [initialFormData, setInitialFormData] = useState(null);
  const [errorNotice, setErrorNotice] = useState("");
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    age: "",
    gender: "",
    nationality: "",
    industry: "",
    location: ""
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
        
        const updates = {};
        if (fname) updates.fname = fname;
        if (lname) updates.lname = lname;
        if (age) updates.age = age;
        if (gender) updates.gender = gender;
        if (nationality) updates.nationality = nationality;
        if (industry) updates.industry = industry;
        if (location) updates.location = location;

        setFormData(updates);
        setInitialFormData(updates);
      } catch (err) {
        console.error("❌ Failed to load user details", err);
      }
    };

    if (user) fetchDetails();
  }, [user]);

  const handleCancel = () => {
    navigate("/profile");
    return;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isEqual = JSON.stringify(formData) === JSON.stringify(initialFormData);
    if (isEqual) {
      navigate("/profile");
      return;
    }

    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      setErrorNotice("Please fill out all required fields correctly.");
      return;
    }

    try {
      await axiosInstance.put("/api/users/details", formData);
      alert("✅ Profile updated successfully!");
      navigate("/profile");
    } catch (err) {
      console.error("❌ Error updating profile", err);
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
            name="location"
            placeholder="Location (e.g., San Jose, CA)"
            value={formData.location}
            onChange={handleChange}
            required
          />

          <div className="step-buttons">
            <button className="btn secondary" onClick={handleCancel}>
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