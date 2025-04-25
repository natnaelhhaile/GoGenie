import React from "react";
import { FaCommentDots } from "react-icons/fa";
import ChatAssistant from "../components/ChatAssistant";
import "./ChatLauncher.css";

const ChatLauncher = ({ isOpen, setIsOpen }) => {
    return (
      <>
        <div className="chat-launcher-icon" onClick={() => setIsOpen(!isOpen)}>
          <FaCommentDots size={24} />
        </div>
        {isOpen && (
          <div className="chat-window">
            <ChatAssistant closeChat={() => setIsOpen(false)} />
          </div>
        )}
      </>
    );
  };
  

export default ChatLauncher;
