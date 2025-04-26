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
  const [fetchingVenue, setFetchingVenue] = useState(false);


  useEffect(() => {
    const storedHistory = localStorage.getItem("chatHistory");
    if (storedHistory) {
      setChatHistory(JSON.parse(storedHistory));
    }
  }, []);


  const navigate = useNavigate();

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, loading]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessage = { role: "user", content: userInput };
    const updatedHistory = [...chatHistory, newMessage];
    setChatHistory(updatedHistory);
    localStorage.setItem("chatHistory", JSON.stringify(updatedHistory));
    setLoading(true);

    try {
      const response = await axiosInstance.post("/api/chat/venue-assistant", {
        message: userInput,
      });

      const reply = response.data.reply;
      let updatedHistoryWithReply;
      // Push different content types to chatHistory
      if (reply.type === "text") {
        updatedHistoryWithReply = [...updatedHistory, { role: "assistant", type: "text", content: reply.message }];
      } else if (reply.type === "recommendation") {
        const venueName = reply.venue.name;
        const fetchVenue = await axiosInstance.get("/api/chat/venue-name", {
          params: { name: venueName }
        });
        setActualVenue(fetchVenue.data);
        updatedHistoryWithReply = [...updatedHistory, { role: "assistant", type: "recommendation", venue: reply.venue }];
      } else {
        updatedHistoryWithReply = [...updatedHistory, { role: "assistant", content: "⚠️ Unexpected response format." }];
      }

      setChatHistory(updatedHistoryWithReply);
      localStorage.setItem("chatHistory", JSON.stringify(updatedHistoryWithReply));


    } catch (err) {
      const errorMessage = { role: "assistant", content: "⚠️ Failed to get a reply. Please try again later." };
      const errorHistory = [...chatHistory, errorMessage];
      setChatHistory(errorHistory);
      localStorage.setItem("chatHistory", JSON.stringify(errorHistory));
    } finally {
      setUserInput("");
      setLoading(false);
    }
  };

  const handleNavigateToVenue = async (venueName) => {
    setFetchingVenue(true); // Start loading spinner

    try {
      const fetchVenue = await axiosInstance.get("/api/chat/venue-name", {
        params: { name: venueName }
      });
      const actualVenue = fetchVenue.data;
      navigate("/venue-detail", { state: { venue: actualVenue } });
    } catch (error) {
      console.error("❌ Failed to fetch venue details:", error);
      alert("Failed to load venue details. Please try again!");
    } finally {
      setFetchingVenue(false); // Stop spinner after fetch
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
    closeChat(); // then close the chat window
  };
  



  return (
    <div className="chat-container">
      {/* Header with Close Button */}
      <div className="chat-header">
        <span>GoGenie Assistant</span>
        <button className="close-btn" onClick={handleCloseChat}>×</button>
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

      {/* Input Field */}
      <div className="chat-input-group">
        <input
          type="text"
          placeholder="Ask me anything..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button className="chat-button" onClick={handleSendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatAssistant;
