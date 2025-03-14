import React, { useEffect, useState } from "react";
import { auth } from "../firebase"; // Import Firebase authentication

const Dashboard = () => {
  const [message, setMessage] = useState("");
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      const user = auth.currentUser;
      if (user) {
        // console.log("User:", user);
        setMessage(`Welcome, ${user.displayName ? user.displayName : user.email}!`);
        const token = await user.getIdToken(); // Get Firebase token


        // fetch("http://localhost:5000/api/dashboard", {
        //   headers: {
        //     Authorization: `Bearer ${token}`, // Send token in headers
        //   },
        // })
        //   .then((res) => res.json())
        //   .then((data) => setMessage(data.message)) // Store API response
        //   .catch((error) => console.error("Error fetching data:", error));
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>{message ? message : "Loading..."}</p>
    </div>
  );
};

export default Dashboard;
