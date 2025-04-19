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
      const token = await userCredential.user.getIdToken();
  
      localStorage.setItem("token", token);
  
      const headers = { Authorization: `Bearer ${token}` };
  
      // Call backend once and get preference status
      const response = await axios.post(`${BACKEND_URL}/api/users/check-new-user`, {}, { headers });
  
      if (response.status === 200) {
        const { hasPreferences } = response.data;
        console.log("Preferences found - front-end: ", hasPreferences);
  
        if (hasPreferences) {
          console.log("✅ Preferences found, redirecting to dashboard");
          navigate("/dashboard");
        } else {
          console.log("ℹ️ No preferences found, redirecting to profile setup");
          navigate("/profile-setup");
        }
      } else {
        throw new Error("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Login Error:", err.message);
      setError("Invalid login credentials or server error.");
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