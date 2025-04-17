import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css"; // Import CSS for styling
import landingImage from "../assets/landing-image.jpg"; // Ensure correct image path
import Container from "./Container"; // Import Container component

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";


const LandingPage = () => {
  const navigate = useNavigate();

  // Firebase Registration Email and Google Sign-In
  useEffect(() => {
    if (!window.firebaseUiInstance) {
      window.firebaseUiInstance = new firebaseui.auth.AuthUI(getAuth());
    }

    window.firebaseUiInstance.start("#firebaseui-auth-container", {
      signInOptions: [
        "google.com",
        {
          provider: "password",
          requireDisplayName: false,
          fullLabel: 'Sign up with Email'
        },
      ],
      callbacks: {
        signInSuccessWithAuthResult: (authResult) => {
          if (authResult.user) {
            console.log("✅ User Signed In:", authResult.user);
            authResult.user.getIdToken().then((token) => {
              localStorage.setItem("token", token);
              console.log("🔑 Firebase Token Stored:", token);
            });

            navigate("/login");
          }
          return false; // Prevent Firebase default redirect
        },
        signInFailure: (error) => {
          console.error("❌ Sign-in Error:", error);
        },
      },
    });

    return () => {
      if (window.firebaseUiInstance) {
        window.firebaseUiInstance.reset();
      }
    };
  }, [navigate]);
  
    return (
      <Container>
        <div className="image-wrapper">
          <img src={landingImage} alt="People socializing" />
        </div>
        <h2>Welcome to GoGenie</h2>
        <div id="firebaseui-auth-container"></div>
        <p>OR</p>
        <div className="button-group">
          <button className="btn" onClick={() => navigate("/login")}>Login with Email</button>
        </div>
      </Container>
    );
  };
  

  export default LandingPage;
