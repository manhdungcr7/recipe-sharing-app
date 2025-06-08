import React, { createContext, useState } from 'react';

export const ChatbotContext = createContext();

export const ChatbotProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const sendMessage = (message) => {
        setMessages((prevMessages) => [...prevMessages, { text: message, sender: 'user' }]);
        setLoading(true);
        // Simulate a response from the chatbot
        setTimeout(() => {
            setMessages((prevMessages) => [...prevMessages, { text: 'Chatbot response', sender: 'bot' }]);
            setLoading(false);
        }, 1000);
    };

    return (
        <ChatbotContext.Provider value={{ messages, loading, sendMessage }}>
            {children}
        </ChatbotContext.Provider>
    );
};