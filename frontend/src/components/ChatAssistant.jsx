import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { isValidSearchQuery, isValidTextField } from "../utils/validators";

import "./ChatAssistant.css";

const ChatAssistant = ({ closeChat }) => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const [fetchingVenue, setFetchingVenue] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const res = await axiosInstance.get("/api/chat/get-chat-history");
        if (Array.isArray(res.data)) {
          setChatHistory(res.data);
          localStorage.setItem("chatHistory", JSON.stringify(res.data)); // fallback cache
        }
      } catch (err) {
        console.warn("⚠️ Could not load chat history from DB. Falling back to localStorage.");
        const stored = localStorage.getItem("chatHistory");
        if (stored) setChatHistory(JSON.parse(stored));
      }
    };
  
    fetchChatHistory();
  }, []);
  

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, loading]);

  const handleSendMessage = async () => {
    if (!isValidSearchQuery(userInput)) {
      showToast("⚠️ Please enter a valid message (2–100 characters).", "error");
      return;
    }

    const newMessage = { role: "user", content: userInput.trim() };
    const updatedHistory = [...chatHistory, newMessage];
    setChatHistory(updatedHistory);
    localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
    setLoading(true);

    try {
      console.log("Sending message to AI:", userInput.trim());
      const response = await axiosInstance.post("/api/chat/venue-assistant", {
        message: userInput.trim(),
      });

      const reply = response.data.reply;
      let updatedHistoryWithReply;

      if (reply.type === "text") {
        updatedHistoryWithReply = [
          ...updatedHistory,
          { role: "assistant", type: "text", content: reply.message },
        ];
      } else if (reply.type === "recommendation") {
        const venueName = reply.venue.name;

        if (!isValidTextField(venueName)) {
          showToast("⚠️ Invalid venue name returned by AI.", "error");
          return;
        }

        const fetchVenue = await axiosInstance.get("/api/chat/venue-name", {
          params: { name: venueName },
        });

        updatedHistoryWithReply = [
          ...updatedHistory,
          { role: "assistant", type: "recommendation", venue: reply.venue },
        ];
      } else {
        updatedHistoryWithReply = [
          ...updatedHistory,
          { role: "assistant", content: "⚠️ Unexpected response format." },
        ];
      }

      setChatHistory(updatedHistoryWithReply);
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistoryWithReply));
    } catch (err) {
      showToast("Failed to get a reply. Please try again later.", "error");
      const errorMessage = {
        role: "assistant",
        content: "⚠️ Failed to get a reply. Please try again later.",
      };
      const errorHistory = [...chatHistory, errorMessage];
      setChatHistory(errorHistory);
      localStorage.setItem("chatHistory", JSON.stringify(errorHistory));
    } finally {
      setUserInput("");
      setLoading(false);
    }
  };

  const handleNavigateToVenue = async (venueName) => {
    if (!isValidTextField(venueName)) {
      showToast("⚠️ Invalid venue name. Please try again.", "error");
      return;
    }

    setFetchingVenue(true);

    try {
      const fetchVenue = await axiosInstance.get("/api/chat/venue-name", {
        params: { name: venueName },
      });
      const actualVenue = fetchVenue.data;
      await saveChatHistoryToDB(); // Save before navigating
      closeChat();
      navigate("/venue-detail", { state: { venue_id: actualVenue.venue_id } });
    } catch (error) {
      console.error("❌ Failed to fetch venue details:", error);
      showToast("Failed to load venue details. Please try again.", "error");
    } finally {
      setFetchingVenue(false);
    }
  };

  const saveChatHistoryToDB = async () => {
    try {
      await axiosInstance.post("/api/chat/save-chat-history", { chatHistory });
    } catch (error) {
      console.error("❌ Error saving chat history:", error);
    }
  };

  const handleCloseChat = async () => {
    await saveChatHistoryToDB();
    closeChat();
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <span>GoGenie Assistant</span>
        <button className="close-btn" onClick={handleCloseChat}>
          ×
        </button>
      </div>

      {/* Chat Body */}
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
                  onClick={() => handleNavigateToVenue(msg.venue.name)}
                  disabled={fetchingVenue}
                >
                  {fetchingVenue ? "Loading..." : "View Details"}
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

      {/* Input */}
      <div className="chat-input-group">
        <input
          type="text"
          placeholder="Ask me anything..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              handleSendMessage();
            }
          }}
        />
        <button
          className="chat-button"
          onClick={handleSendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatAssistant;