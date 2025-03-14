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

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    console.log(process.env.REACT_APP_PORT);

    try {
      // ✅ Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("✅ Email Login Successful:", userCredential.user);

      // ✅ Retrieve userId and Token from Firebase
      const userId = userCredential.user.uid; // Firebase userId
      const token = await userCredential.user.getIdToken();

      // ✅ Store in Local Storage
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      console.log(token);

      // ✅ Send userId to the backend to check if user exists (or create new entry)
      // ✅ Check if user preferences exist
      const response = await axios.get(
        `http://localhost:5001/api/users/preferences/${userId}`
      );
      console.log("request to preference users")
      if (response.data) {
        console.log("✅ Preferences found, redirecting to Dashboard");
        navigate("/dashboard"); // ✅ Redirect to Dashboard if preferences exist
      } else {
        console.log("❌ No preferences found, redirecting to Profile Setup");
        // ✅ Send userId to the backend to check if user exists (or create new entry if not)
        await axios.post(`http://localhost:5001/api/users/login-or-register`, {
          userId,
          email,
        });

        // Redirect to Profile Setup after login
        navigate("/profile-setup");
      }
    } catch (err) {
      console.error("❌ Login Error:", err.message);
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
