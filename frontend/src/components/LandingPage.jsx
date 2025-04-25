import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import landingImage from "../assets/landing-image.jpg";
import Container from "./Container";
import { getAuth, EmailAuthProvider, GoogleAuthProvider } from "firebase/auth";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
import axiosInstance from "../api/axiosInstance";

const LandingPage = () => {
  const navigate = useNavigate();
  const uiRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();
  
    // grab or create the AuthUI instance, then reset its DOM
    let ui = firebaseui.auth.AuthUI.getInstance();
    if (ui) {
      ui.reset();
    } else {
      ui = new firebaseui.auth.AuthUI(auth);
    }
    uiRef.current = ui;
  
    ui.start("#firebaseui-auth-container", {
      // force popup instead of redirect
      signInFlow: "popup",
  
      signInOptions: [
        GoogleAuthProvider.PROVIDER_ID,
        {
          provider: EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false,
          fullLabel: "Sign up with Email",
        },
      ],
  
      callbacks: {
        // this fires on a successful sign-in
        signInSuccessWithAuthResult: async (authResult) => {
          console.log("✅ FirebaseUI callback fired:", authResult.user.uid);
          localStorage.setItem("sessionStart", Date.now());
          try {
            const { data } = await axiosInstance.post("/api/users/check-new-user");
            console.log("→ hasPreferences:", data.hasPreferences);
            navigate(data.hasPreferences ? "/dashboard" : "/profile-setup");
          } catch (err) {
            console.error("Error checking new user:", err);
            navigate("/dashboard");
          }
          // returning false prevents any default redirect
          return false;
        },
        // this fires once the widget is fully rendered
        uiShown: () => console.log("🔧 FirebaseUI is now visible"),
        signInFailure: (err) => {
          console.error("❌ Sign-in Error:", err);
        },
      },
    });
  
    return () => {
      if (uiRef.current) uiRef.current.reset();
    };
  }, [navigate]);  

  return (
    <div className="fullscreen-wrapper">
      <Container>
        <div className="landing-inner">
          <img
            src={landingImage}
            alt="People socializing"
            className="hero-image"
          />
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
