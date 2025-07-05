import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { currentUser } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Thay đổi đoạn này - thử lấy token từ cả hai key
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Bạn cần đăng nhập để xem thông báo');
      }
      
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Không thể tải thông báo');
      }
      
      const data = await response.json();
      setNotifications(data.data || []);
      
      // Đếm số thông báo chưa đọc
      const unread = data.data.filter(notification => !notification.is_read).length;
      setUnreadCount(unread);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAsRead = async (id) => {
    try {
      // Sửa đoạn này
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Cập nhật UI
      setNotifications(notifications.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: true } 
          : notification
      ));
      
      // Cập nhật lại số lượng thông báo chưa đọc
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      // Sửa đoạn này
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notifications/markAllRead', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Cập nhật UI
      setNotifications(notifications.map(notification => ({ ...notification, is_read: true })));
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };
  
  const handleReply = (notification) => {
    setSelectedNotification(notification);
    setReplyText('');
    setShowReplyModal(true);
  };
  
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    try {
      setSubmitting(true);
      // Sửa đoạn này
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/notifications/${selectedNotification.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reply: replyText }) // Đảm bảo key này khớp với tham số trong controller (reply hoặc message)
      });
      
      if (!response.ok) {
        throw new Error('Không thể gửi phản hồi');
      }
      
      alert('Đã gửi phản hồi thành công');
      setShowReplyModal(false);
      setReplyText('');
      
    } catch (err) {
      console.error('Error sending reply:', err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSendMessageToAdmin = async (e) => {
    e.preventDefault();
    if (!adminMessage.trim()) return;
    
    try {
      setSubmitting(true);
      // Sửa đoạn này
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/notifications/message-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: adminMessage })
      });
      
      if (!response.ok) {
        throw new Error('Không thể gửi tin nhắn');
      }
      
      alert('Đã gửi tin nhắn tới admin thành công');
      setShowMessageModal(false);
      setAdminMessage('');
      
    } catch (err) {
      console.error('Error sending message to admin:', err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Lọc thông báo theo tab đang chọn
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.is_read;
    // Loại bỏ dòng if (activeTab === 'system') return notification.type === 'system';
    if (activeTab === 'interaction') return ['like', 'comment', 'follow', 'save', 'share'].includes(notification.type);
    if (activeTab === 'admin') {
      // Chuyển thông báo 'system' vào tab Admin hoặc để trong tab 'Tất cả'
      return notification.type === 'admin' || notification.type === 'moderation' || 
             notification.type === 'admin_message' || notification.type === 'system';
    }
    return true;
  });
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return 'fas fa-heart';
      case 'comment': return 'fas fa-comment';
      case 'follow': return 'fas fa-user-plus';
      case 'save': return 'fas fa-bookmark';
      case 'share': return 'fas fa-share-alt';
      case 'admin': return 'fas fa-shield-alt';
      // Thêm case cho moderation
      case 'moderation': return 'fas fa-shield-alt';
      default: return 'fas fa-bell';
    }
  };
  
  const getNotificationLink = (notification) => {
    // Thông báo từ admin không có link chuyển hướng
    if (notification.type === 'admin' || notification.type === 'admin_message' || notification.type === 'moderation') {
      return '#'; // Không chuyển hướng
    }
    
    // Các loại thông báo khác giữ nguyên logic hiện tại
    if (notification.related_recipe_id) {
      return `/recipes/${notification.related_recipe_id}`;
    }
    if (notification.related_comment_id) {
      return `/recipes/${notification.related_recipe_id}#comment-${notification.related_comment_id}`;
    }
    // mã xử lý khác...
    return '/notifications';
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'new_post':
        return (
          <>
            <strong>{notification.sender_name}</strong> vừa đăng bài <strong>{notification.content.match(/"(.+)"/)?.[1] || ''}</strong>
          </>
        );
      case 'like':
        return (
          <>
            <strong>{notification.sender_name}</strong> đã thích công thức <strong>{notification.recipe_title || ''}</strong> của bạn
          </>
        );
      case 'comment':
        return (
          <>
            <strong>{notification.sender_name}</strong> đã bình luận về công thức <strong>{notification.recipe_title || ''}</strong> của bạn
          </>
        );
      case 'reply':
        return (
          <>
            <strong>{notification.sender_name}</strong> đã trả lời bình luận của bạn
          </>
        );
      case 'follow':
        return (
          <>
            <strong>{notification.sender_name}</strong> đã theo dõi bạn
          </>
        );
      case 'admin':
        return (
          <>
            <strong>Admin:</strong> {notification.content}
          </>
        );
      // Thêm case cho thông báo moderation
      case 'moderation':
        return (
          <>
            <strong>Admin:</strong> {notification.content}
          </>
        );
      // Thêm case cho thông báo admin_message
      case 'admin_message':
        return (
          <>
            <strong>Admin:</strong> {notification.content}
          </>
        );
      default:
        return notification.content;
    }
  };
  
  // Xử lý khi nhấn vào thông báo
  const handleNotificationClick = (notification) => {
    // Đánh dấu thông báo là đã đọc
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    // Nếu là thông báo từ admin, hiển thị modal phản hồi
    if (notification.type === 'admin' || notification.type === 'admin_message' || notification.type === 'moderation') {
      handleReply(notification);
    } else if (notification.related_recipe_id) {
      // Chuyển hướng đến trang công thức nếu có
      navigate(getNotificationLink(notification));
    }
  };
  
  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1>Thông báo</h1>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button 
              className="mark-all-read-btn" 
              onClick={handleMarkAllAsRead}
            >
              Đánh dấu tất cả là đã đọc
            </button>
          )}
          <button 
            className="message-admin-btn"
            onClick={() => setShowMessageModal(true)}
          >
            <i className="fas fa-paper-plane"></i> Gửi tin nhắn đến Admin
          </button>
        </div>
      </div>
      
      <div className="notifications-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Tất cả
        </button>
        <button 
          className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Chưa đọc {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'interaction' ? 'active' : ''}`}
          onClick={() => setActiveTab('interaction')}
        >
          Tương tác
        </button>
        <button 
          className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          Admin
        </button>
      </div>
      
      <div className="notifications-list">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tải thông báo...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-bell-slash"></i>
            <p>Không có thông báo nào trong mục này</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
            >
              <div className="notification-icon">
                <i className={getNotificationIcon(notification.type)}></i>
              </div>
              <div className="notification-content">
                {/* Thay thế Link bằng div với onClick event */}
                <div
                  className="notification-text"
                  style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {getNotificationText(notification)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Modal phản hồi */}
      {showReplyModal && selectedNotification && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Phản hồi đến Admin</h3>
              <button className="close-btn" onClick={() => setShowReplyModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="original-message">
                <p><strong>Admin:</strong> {selectedNotification.content}</p>
                <span className="message-time">
                  {new Date(selectedNotification.created_at).toLocaleString('vi-VN')}
                </span>
              </div>
              
              <form onSubmit={handleSubmitReply}>
                <div className="form-group">
                  <label>Nội dung phản hồi:</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập phản hồi của bạn..."
                    rows="4"
                    required
                  ></textarea>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowReplyModal(false)}
                    disabled={submitting}
                  >
                    Huỷ
                  </button>
                  <button 
                    type="submit"
                    className="submit-btn"
                    disabled={submitting || !replyText.trim()}
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal gửi tin nhắn đến Admin */}
      {showMessageModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Gửi tin nhắn tới Admin</h3>
              <button className="close-btn" onClick={() => setShowMessageModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSendMessageToAdmin}>
                <div className="form-group">
                  <label>Nội dung tin nhắn:</label>
                  <textarea
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder="Nhập nội dung tin nhắn của bạn..."
                    rows="5"
                    required
                  ></textarea>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowMessageModal(false)}
                    disabled={submitting}
                  >
                    Huỷ
                  </button>
                  <button 
                    type="submit"
                    className="submit-btn"
                    disabled={submitting || !adminMessage.trim()}
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;