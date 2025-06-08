import React, { useState, useEffect, useRef } from 'react';
import './ChatbotModal.css';

const ChatbotModal = ({ recipe, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Tự động scroll đến tin nhắn cuối cùng
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Gửi tin nhắn chào mừng khi mở chatbot
  useEffect(() => {
    setMessages([
      {
        id: Date.now(),
        text: `Xin chào! Tôi là trợ lý ảo cho công thức "${recipe.title}". Bạn có câu hỏi gì về nguyên liệu, cách nấu, hoặc mẹo nấu ăn không?`,
        sender: 'bot'
      }
    ]);
  }, [recipe.title]);
  
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Thêm tin nhắn của người dùng vào danh sách
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Gọi API backend để lấy phản hồi từ chatbot
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          recipeId: recipe.id,
          question: inputMessage,
          recipeContext: {
            title: recipe.title,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            cookingTime: recipe.cooking_time,
            difficulty: recipe.difficulty,
            thoughts: recipe.thoughts || ''
          }
        })
      });
      
      const data = await response.json();
      
      // Thêm phản hồi từ bot vào danh sách tin nhắn
      const botMessage = {
        id: Date.now() + 1,
        text: data.answer || "Xin lỗi, tôi không thể trả lời câu hỏi này vào lúc này.",
        sender: 'bot'
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      
      // Thêm thông tin lỗi chi tiết hơn
      const errorMessage = {
        id: Date.now() + 1,
        text: error.response?.data?.message || 
              "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.",
        sender: 'bot'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };
  
  return (
    <div className="chatbot-modal">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <div className="chatbot-title">
            <i className="fas fa-robot"></i>
            <h3>Trợ lý nấu ăn</h3>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="chatbot-messages">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'bot' ? 'bot-message' : 'user-message'}`}
            >
              {message.sender === 'bot' && (
                <div className="bot-avatar">
                  <i className="fas fa-robot"></i>
                </div>
              )}
              <div className="message-bubble">
                {message.text}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot-message">
              <div className="bot-avatar">
                <i className="fas fa-robot"></i>
              </div>
              <div className="message-bubble typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chatbot-input">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotModal;