import React, { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!window.firebaseUiInstance) {
      window.firebaseUiInstance = new firebaseui.auth.AuthUI(getAuth());
    }

    window.firebaseUiInstance.start("#firebaseui-auth-container", {
      signInOptions: [
        "google.com",
        "facebook.com",
        "phone",
        "anonymous",
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

            navigate("/dashboard");
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

  // Manual Email & Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Email Login Successful:", userCredential.user);
      
      // Store token for session management
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);

      navigate("/dashboard"); // Redirect to dashboard after login
    } catch (err) {
      console.error("❌ Login Error:", err.message);
      setError(err.message); // Display error message
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <div id="firebaseui-auth-container"></div>

      {/* Manual Email Login Form */}
      <h3>Or Login with Email</h3>
      <form onSubmit={handleEmailLogin}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit">Login</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Auth;
