import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Container from "./Container";
import "./ForgotPassword.css";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("✅ A password reset link has been sent to your email.");
      setError("");
    } catch (err) {
      setError("❌ Could not send reset email. Please try again.");
      setStatus("");
    }
  };

  return (
    <Container>
      <h2>Forgot Password</h2>
      <p>Enter your email and we’ll send you a reset link.</p>
      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn">Send Reset Link</button>
      </form>

      {status && <p className="status-message">{status}</p>}
      {error && <p className="error-message">{error}</p>}

      <button
        onClick={() => navigate("/login")}
        className="btn secondary back-to-login"
      >
        Back to Login
      </button>
    </Container>
  );
};

export default ForgotPasswordPage;
