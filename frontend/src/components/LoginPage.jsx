import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const token = await userCredential.user.getIdToken();

      localStorage.setItem("token", token);
      localStorage.setItem("uid", uid);

      const headers = { Authorization: `Bearer ${token}` };
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
      setError(err.message);
    }
  };

  return (
    <div className="fullscreen-wrapper">
      <Container>
        <div className="login-inner">
          <img src={landingImage} alt="People socializing" className="hero-image" />
          <h2>Welcome back 👋</h2>

          <form className="login-form" onSubmit={handleEmailLogin}>
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
            <p className="forgot-password">Create an account</p>
            {error && <p className="error-text">{error}</p>}
          </form>
        </div>
      </Container>
    </div>
  );
};

export default LoginPage;
