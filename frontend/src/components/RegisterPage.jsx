import React from "react";
import { useNavigate } from "react-router-dom";
import Container from "./Container";
import "./RegisterPage.css";
import landingImage from "../assets/landing-image.jpg"; // Ensure correct image path


const RegisterPage = () => {
  const navigate = useNavigate();
  
  return (
    <Container>
      <div className="image-wrapper2">
        <img src={landingImage} alt="People socializing" />
      </div>
      <form>
      <div className="input-group">
          <label>Full Name</label>
          <input type="text" placeholder="Enter your full name" />
        </div>
        <div className="input-group">
          <label>Email</label>
          <input type="email" placeholder="Enter your email" />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input type="password" placeholder="Create a password" />
        </div>
        <div className="input-group">
          <label>Confirm Password</label>
          <input type="password" placeholder="Confirm your password" />
        </div>
        <button className="btn">Create Account</button>
        <p className="login-link">
          Already have an account? <span onClick={() => navigate("/login")}>Sign in</span>
        </p>
      </form>
    </Container>
  );
};

export default RegisterPage;
