import React, { useState } from 'react';
import './ChatbotButton.css';
import ChatbotModal from './ChatbotModal';

const ChatbotButton = ({ recipe }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <>
      <button className="chatbot-trigger-button" onClick={toggleChatbot}>
        <i className="fas fa-robot"></i>
      </button>
      
      {isOpen && (
        <ChatbotModal 
          recipe={recipe}
          onClose={toggleChatbot}
        />
      )}
    </>
  );
};

export default ChatbotButton;