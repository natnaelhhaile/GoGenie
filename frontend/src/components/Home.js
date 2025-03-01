import React from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <h1>Welcome to GoGenie</h1>
      <p>Your AI-powered personalized venue recommendation platform.</p>

      {/* If user is logged in, show dashboard button */}
      {auth.currentUser ? (
        <Link to="/dashboard">
          <button className="btn">Go to Dashboard</button>
        </Link>
      ) : (
        // If user is not logged in, show login button
        <Link to="/login">
          <button className="btn">Sign In</button>
        </Link>
      )}
    </div>
  );
};

export default Home;
