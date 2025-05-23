import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import axiosInstance from "../api/axiosInstance";
import Container from "./Container";
import { useToast } from "../context/ToastContext";
import "./LoginPage.css";
import landingImage from "../assets/landing-image.jpg";

const LoginPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("sessionStart", Date.now());

      const res = await axiosInstance.post("/api/users/check-new-user");
      if (res.status === 200) {
        showToast("🎉 Welcome back!", "success");
        const { hasPreferences } = res.data;
        navigate(hasPreferences ? "/dashboard" : "/profile-setup");
      } else {
        throw new Error("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Login Error:", err.message);
      showToast("💀 Invalid login credentials.", "error");
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

            <div className="forgot-password">
              <p onClick={() => navigate("/forgot-password")}>Forgot password?</p>
              <p onClick={() => navigate("/")}>Create an account</p>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
};

export default LoginPage;