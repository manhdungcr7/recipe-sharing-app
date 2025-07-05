import React, { useState, useEffect } from 'react';
import './AdminMessagesPage.css';

const AdminMessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // Sử dụng API route debug thay vì API chính
      const response = await fetch('http://localhost:5000/api/debug/raw-admin-messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải tin nhắn');
      }

      const data = await response.json();
      console.log("Received messages:", data);
      setMessages(data.data || []);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedMessage.sender_id}/notify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: replyText })
      });
      
      if (!response.ok) {
        throw new Error('Không thể gửi phản hồi');
      }
      
      alert('Đã gửi phản hồi thành công');
      setReplyText('');
      setSelectedMessage(null);
      
    } catch (error) {
      console.error('Error sending reply:', error);
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Giữ nguyên logic, chỉ thay đổi cấu trúc HTML để cải thiện giao diện

  // Thay đổi phần return của component
  return (
    <div className="admin-messages-page">
      <div className="admin-page-header">
        <h1>Tin nhắn từ người dùng</h1>
        <p className="messages-description">
          Xem và phản hồi các tin nhắn được gửi từ người dùng hệ thống
        </p>
      </div>

      {loading ? (
        <div className="admin-loading-container">
          <div className="spinner"></div>
          <p>Đang tải tin nhắn...</p>
        </div>
      ) : error ? (
        <div className="admin-error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="admin-empty-state">
          <i className="far fa-envelope-open"></i>
          <h3>Không có tin nhắn nào</h3>
          <p>Hiện tại chưa có tin nhắn nào từ người dùng</p>
        </div>
      ) : (
        <div className="admin-messages-container">
          <div className="messages-list">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message-item ${selectedMessage?.id === message.id ? 'selected' : ''}`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="message-sender">
                  <div className="sender-avatar">
                    <img 
                      src={message.sender_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender_name)}&background=random`}
                      alt={message.sender_name}
                    />
                  </div>
                  <div className="sender-info">
                    <h4>{message.sender_name}</h4>
                    <span className="message-time">{formatDate(message.created_at)}</span>
                  </div>
                </div>
                <p className="message-preview">{message.content.substring(0, 60)}...</p>
                <div className="message-status">
                  {message.replied ? (
                    <span className="status replied">
                      <i className="fas fa-check-circle"></i> Đã phản hồi
                    </span>
                  ) : (
                    <span className="status pending">
                      <i className="fas fa-clock"></i> Chưa phản hồi
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="message-detail">
            {selectedMessage ? (
              <>
                <div className="detail-header">
                  <div className="sender-info">
                    <img 
                      src={selectedMessage.sender_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMessage.sender_name)}&background=random`}
                      alt={selectedMessage.sender_name}
                      className="sender-avatar"
                    />
                    <div>
                      <h3>{selectedMessage.sender_name}</h3>
                      <span className="message-time">{formatDate(selectedMessage.created_at)}</span>
                    </div>
                  </div>
                  <div className="message-actions">
                    <button className="btn-view-profile" onClick={() => window.open(`/admin/users/${selectedMessage.sender_id}`, '_blank')}>
                      <i className="fas fa-user"></i> Xem hồ sơ
                    </button>
                  </div>
                </div>

                <div className="message-content">
                  <p>{selectedMessage.content}</p>
                </div>

                <form className="reply-form" onSubmit={handleReply}>
                  <h4>
                    <i className="fas fa-reply"></i> Phản hồi tin nhắn
                  </h4>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập phản hồi của bạn..."
                    rows="4"
                    required
                  ></textarea>
                  
                  <button 
                    type="submit" 
                    className="btn-reply" 
                    disabled={submitting || !replyText.trim()}
                  >
                    {submitting ? 
                      <><i className="fas fa-spinner fa-spin"></i> Đang gửi...</> : 
                      <><i className="fas fa-paper-plane"></i> Gửi phản hồi</>
                    }
                  </button>
                </form>
              </>
            ) : (
              <div className="no-message-selected">
                <i className="far fa-comment-dots"></i>
                <h3>Chọn tin nhắn để xem chi tiết</h3>
                <p>Chọn một tin nhắn từ danh sách bên trái để xem chi tiết và phản hồi</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessagesPage;