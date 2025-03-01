import React from "react";
import { useNavigate } from "react-router-dom";
import Container from "./Container";
import "./LoginPage.css";
import landingImage from "../assets/landing-image.jpg"; // Ensure correct image path


const LoginPage = () => {
  const navigate = useNavigate();
  
  return (
    <Container>
      <div className="image-wrapper2">
        <img src={landingImage} alt="People socializing" />
      </div>
      <form>
        <div className="input-group">
          <label>Email</label>
          <input type="email" placeholder="Enter your email" />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input type="password" placeholder="Enter your password" />
        </div>
        <button className="btn">Sign In</button>
        <p className="forgot-password" onClick={() => navigate("/forgot-password")}>
          Forgot password?
        </p>
      </form>
    </Container>
  );
};

export default LoginPage;
