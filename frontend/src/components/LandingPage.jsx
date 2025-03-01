import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css"; // Import CSS for styling
import landingImage from "../assets/landing-image.jpg"; // Ensure correct image path
import Container from "./Container"; // Import Container component

const LandingPage = () => {
    const navigate = useNavigate();
  
    return (
      <Container>
        <div className="image-wrapper">
          <img src={landingImage} alt="People socializing" />
        </div>
        <h2>Welcome to CultureConnect</h2>
        <div className="button-group">
          <button className="btn" onClick={() => navigate("/login")}>Login</button>
          <button className="btn" onClick={() => navigate("/signup")}>Sign up</button>
        </div>
      </Container>
    );
  };
  
  export default LandingPage;
