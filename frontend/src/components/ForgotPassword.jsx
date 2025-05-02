import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
      <header className="forgot-header">
        <h2>Reset Your Password</h2>
      </header>

      <motion.section
        className="forgot-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="forgot-instruction">
          Enter your email address and we'll send you a password reset link.
        </p>

        <form className="forgot-form" onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            onClick={() => navigate("/profile")}
            className="btn secondary back-to-login"
          >
            Cancel
          </button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn primary"
            type="submit"
          >
            Send Reset Link
          </motion.button>
        </form>

        {status && <p className="status-message success">{status}</p>}
        {error && <p className="status-message error">{error}</p>}

      </motion.section>
    </Container>
  );
};

export default ForgotPasswordPage;