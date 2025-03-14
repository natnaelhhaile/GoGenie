import React, {useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";

import Container from "./Container";
import "./RegisterPage.css";
import landingImage from "../assets/landing-image.jpg"; // Ensure correct image path


const RegisterPage = () => {
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
          requireDisplayName: true,
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
      <div className="image-wrapper2">
        <img src={landingImage} alt="People socializing" />
      </div>
      <div id="firebaseui-auth-container"></div>
      <p>OR</p>
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
