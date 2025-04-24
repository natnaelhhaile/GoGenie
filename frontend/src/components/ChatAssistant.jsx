import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";

import "./ChatAssistant.css";

const ChatAssistant = ({ closeChat }) => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

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
      setChatHistory((prev) => [...prev, { role: "assistant", content: reply }]);
      console.log("Response received:", reply);
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
        {chatHistory.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
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
