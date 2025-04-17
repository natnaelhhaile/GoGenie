import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import Axios to send API requests
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import Container from "./Container";
import "./LoginPage.css";
import landingImage from "../assets/landing-image.jpg";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    console.log(BACKEND_URL);

    try {
      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Email Login Successful:", userCredential.user);

      // Retrieve userId and Token from Firebase
      const userId = userCredential.user.uid; // Firebase userId
      const token = await userCredential.user.getIdToken();

      // Store in Local Storage
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      console.log(token);

      // Create headers for all authenticated requests
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // ✅ 1. Ensure user exists in DB
    await axios.post(`${BACKEND_URL}/api/users/new-user`, {}, { headers });

    // ✅ 2. Check for preferences
    const response = await axios.get(`${BACKEND_URL}/api/users/preferences/${userId}`, {
      headers,
      validateStatus: () => true
    });

    if (response.status === 200 && response.data) {
      console.log("User preferences found:", response.data);
      navigate("/dashboard");
    } else {
      console.log("No preferences found, redirecting to profile setup.");
      navigate("/profile-setup");
    }

    } catch (err) {
      console.error("Login Error:", err.message);
      setError(err.message); // Display error message
    }
  };

  return (
    <Container>
      <div className="image-wrapper2">
        <img src={landingImage} alt="People socializing" />
      </div>
      <form onSubmit={handleEmailLogin}>
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn">Sign In</button>
        <p className="forgot-password">Forgot password?</p>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </Container>
  );
};

export default LoginPage;
// Compare this snippet from CultureConnect/frontend/src/components/ProfileSetup.jsx:
