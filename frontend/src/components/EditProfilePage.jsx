import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Container from "../components/Container";
import "./EditProfilePage.css";

const EditProfilePage = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    age: "",
    gender: "",
    nationality: ""
  });

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "nonBinary", label: "Non-Binary" },
    { value: "preferNot", label: "Prefer Not To Say" },
  ];

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await axiosInstance.get("/api/users/preferences");
        const { fname, lname, age, gender, nationality } = res.data;
        setFormData({
          fname: fname || "",
          lname: lname || "",
          age: age || "",
          gender: gender || "",
          nationality: nationality || ""
        });
      } catch (err) {
        console.error("❌ Failed to load user preferences", err);
      }
    };

    if (user) fetchPreferences();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      <h2 className="edit-title">Edit Your Profile</h2>
      <form onSubmit={handleSubmit} className="edit-form">
        <label>
          First Name:
          <input name="fname" value={formData.fname} onChange={handleChange} required />
        </label>
        <label>
          Last Name:
          <input name="lname" value={formData.lname} onChange={handleChange} required />
        </label>
        <label>
          Age:
          <input name="age" type="number" value={formData.age} onChange={handleChange} />
        </label>
        <label>
          Gender:
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