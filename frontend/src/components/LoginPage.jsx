import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "./Container";
import "./LoginPage.css";
import landingImage from "../assets/landing-image.jpg"; // Ensure correct image path

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
// import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";


const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");


  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Email Login Successful:", userCredential.user);

      // Store token for session management
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);

      navigate("/profile-setup"); // Redirect to dashboard after login
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
          />
        </div>
        <button className="btn">Sign In</button>
        <p className="forgot-password">
          Forgot password?
        </p>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </Container>
  );
};

export default LoginPage;
