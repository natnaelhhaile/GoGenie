import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../firebase";
import Container from "../components/Container";
import "./EditProfilePage.css";

const EditProfilePage = () => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    age: "",
    gender: "",
    nationality: ""
  });
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchPreferences = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const response = await axios.get(`${BACKEND_URL}/api/users/preferences/${user.uid}`);
        const data = response.data;
        setFormData({
          name: data.name || "",
          username: data.username || "",
          age: data.age || "",
          gender: data.gender || "",
          nationality: data.nationality || ""
        });
      } catch (err) {
        console.error("❌ Failed to load user preferences", err);
      }
    };

    fetchPreferences();
  }, [BACKEND_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await axios.put(`${BACKEND_URL}/api/users/details/${user.uid}`, formData);
      alert("✅ Profile updated successfully!");
      navigate("/profile");
    } catch (err) {
      console.error("❌ Error updating profile", err);
    }
  };

  return (
    <Container>
      <h2 className="edit-title">Edit Your Profile</h2>
      <form onSubmit={handleSubmit} className="edit-form">
        <label>
          Name:
          <input name="name" value={formData.name} onChange={handleChange} required />
        </label>
        <label>
          Username:
          <input name="username" value={formData.username} onChange={handleChange} />
        </label>
        <label>
          Age:
          <input name="age" type="number" value={formData.age} onChange={handleChange} />
        </label>
        <label>
          Gender:
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Non-binary</option>
            <option>Prefer not to say</option>
          </select>
        </label>
        <label>
          Nationality:
          <input name="nationality" value={formData.nationality} onChange={handleChange} />
        </label>
        <button className="save-button" type="submit">Save Changes</button>
      </form>
    </Container>
  );
};

export default EditProfilePage;
