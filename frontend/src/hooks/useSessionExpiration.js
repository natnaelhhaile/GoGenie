import { useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const MAX_SESSION_DURATION = 3 * 60 * 60 * 1000; // 3 hours

const useSessionExpiration = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkExpiration = () => {
      const startTime = parseInt(localStorage.getItem("sessionStart"), 10);
      if (!startTime) return;

      const now = Date.now();
      if (now - startTime > MAX_SESSION_DURATION) {
        console.warn("🕒 Session expired. Signing out...");
        getAuth().signOut();
        localStorage.removeItem("sessionStart");
        navigate("/login");
      }
    };

    checkExpiration();

    const interval = setInterval(checkExpiration, 60 * 1000); // Check every 60s
    return () => clearInterval(interval);
  }, [navigate]);
};

export default useSessionExpiration;