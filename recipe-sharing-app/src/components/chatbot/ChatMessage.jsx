import React from 'react';

const ChatMessage = ({ message, isUser }) => {
    return (
        <div className={`chat-message ${isUser ? 'user-message' : 'bot-message'}`}>
            <p>{message}</p>
        </div>
    );
};

export default ChatMessage;