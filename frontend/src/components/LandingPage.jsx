import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import landingImage from "../assets/landing-image.jpg";
import Container from "./Container";

import { getAuth } from "firebase/auth";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";

const LandingPage = () => {
  const navigate = useNavigate();

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
          fullLabel: "Sign up with Email",
        },
      ],
      callbacks: {
        signInSuccessWithAuthResult: (authResult) => {
          if (authResult.user) {
            authResult.user.getIdToken().then((token) => {
              localStorage.setItem("token", token);
            });
            navigate("/login");
          }
          return false;
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
    <div className="fullscreen-wrapper">
      <Container>
        <div className="landing-inner">
          <img src={landingImage} alt="People socializing" className="hero-image" />
          <h2>Welcome to GoGenie</h2>

          <div id="firebaseui-auth-container"></div>

          <div className="or-separator">
            <hr />
            <span>OR</span>
            <hr />
          </div>

          <button className="btn" onClick={() => navigate("/login")}>
            Login with Email
          </button>
        </div>
      </Container>
    </div>
  );
};

export default LandingPage;
