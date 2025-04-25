import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

import "./ChatAssistant.css";

const ChatAssistant = ({ closeChat }) => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const [actualVenue, setActualVenue] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, loading]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessage = { role: "user", content: userInput };
    setChatHistory((prev) => [...prev, newMessage]);
    setLoading(true);

    try {
      const response = await axiosInstance.post("/api/chat/venue-assistant", {
        message: userInput,
      });

      const reply = response.data.reply;
      // Push different content types to chatHistory
      if (reply.type === "text") {
        setChatHistory((prev) => [...prev, { role: "assistant", type: "text", content: reply.message }]);
      } else if (reply.type === "recommendation") {
        const venueName = reply.venue.name;
        const fetchVenue = await axiosInstance.get("/api/chat/venue-name", {
          params: { name: venueName }
        });
        const actualVen = fetchVenue.data;
        setActualVenue(actualVen);
        setChatHistory((prev) => [...prev, { role: "assistant", type: "recommendation", venue: reply.venue }]);
        console.log("frontend actual venue:", reply.venue);
      } else {
        setChatHistory((prev) => [...prev, { role: "assistant", content: "⚠️ Unexpected response format." }]);
      }

    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Failed to get a reply. Please try again later." },
      ]);
    } finally {
      setUserInput("");
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Header with Close Button */}
      <div className="chat-header">
        <span>GoGenie Assistant</span>
        <button className="close-btn" onClick={closeChat}>×</button>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages">
        {chatHistory.map((msg, i) => {
          if (msg.type === "recommendation") {
            return (
              <div key={i} className="recommendation-card assistant">
                <h4>{msg.venue.name}</h4>
                <p>{msg.venue.description}</p>
                <p><strong>Category:</strong> {msg.venue.category}</p>
                <p><strong>Address:</strong> {msg.venue.address}</p>
                <button
                  className="details-button"
                  onClick={() => navigate("/venue-detail", { state: { venue: actualVenue } })}
                >
                  View Details
                </button>
              </div>
            );
          }

          return (
            <div key={i} className={`chat-message ${msg.role}`}>
              {msg.content}
            </div>
          );
        })}
        {loading && <div className="chat-message assistant">Thinking...</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input Field */}
      <div className="chat-input-group">
        <input
          type="text"
          placeholder="Ask me anything..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button onClick={handleSendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatAssistant;
