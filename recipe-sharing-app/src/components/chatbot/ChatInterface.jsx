import React, { useState, useContext } from 'react';
import { ChatbotContext } from '../../context/ChatbotContext';
import ChatMessage from './ChatMessage';

const ChatInterface = () => {
    const { messages, sendMessage } = useContext(ChatbotContext);
    const [input, setInput] = useState('');

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="chat-interface">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <ChatMessage key={index} message={msg} />
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="chat-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatInterface;