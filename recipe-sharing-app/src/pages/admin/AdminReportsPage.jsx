import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminReportsPage.css';

const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Thêm state để quản lý modal tin nhắn
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Thêm state mới
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' hoặc 'messages'
  const [messages, setMessages] = useState([]);
  
  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Thay đổi token này
      const token = localStorage.getItem('auth_token');
      
      // Đảm bảo URL đúng với backend
      const response = await fetch(`http://localhost:5000/api/admin/reports?page=${currentPage}&limit=10&status=${filterStatus}&type=${filterType}&search=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }
      
      const data = await response.json();
      
      setReports(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Thêm hàm fetch messages
  const fetchMessages = async () => {
    if (activeTab !== 'messages') return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/admin/notifications?type=admin_message', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Không thể tải tin nhắn');
      
      const data = await response.json();
      setMessages(data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    } else {
      fetchReports();
    }
  }, [activeTab, currentPage, filterStatus, filterType]);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReports(1);
  };
  
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowModal(true);
    setResponseText('');
  };
  
  // Hàm đổi trạng thái
  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const token = localStorage.getItem('auth_token');
      // Đảm bảo URL đúng
      const response = await fetch(`http://localhost:5000/api/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Không thể cập nhật trạng thái báo cáo');
      }
      
      // Cập nhật danh sách báo cáo
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus, updated_at: new Date().toISOString() }
          : report
      ));
      
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
      
    } catch (error) {
      console.error('Error updating report status:', error);
      alert(error.message);
    }
  };
  
  // Hàm gửi phản hồi - sửa responseText thành response
  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) return;
    
    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/reports/${selectedReport.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Thay đổi này: responseText -> response
        body: JSON.stringify({ response: responseText })
      });
      
      if (!response.ok) {
        throw new Error('Không thể gửi phản hồi');
      }
      
      // Cập nhật UI
      const updatedReports = reports.map(report => 
        report.id === selectedReport.id 
          ? { ...report, status: 'resolved', admin_response: responseText, updated_at: new Date().toISOString() }
          : report
      );
      
      setReports(updatedReports);
      setSubmitting(false);
      setShowModal(false);
      
      // Thông báo thành công
      alert('Đã gửi phản hồi thành công!');
      
    } catch (error) {
      console.error('Error sending response:', error);
      alert(error.message);
      setSubmitting(false);
    }
  };
  
  const handleTakeAction = async (action) => {
    if (!selectedReport) return;
    
    if (!window.confirm(`Bạn có chắc chắn muốn ${action === 'delete' ? 'xóa' : 'khóa'} ${selectedReport.type === 'recipe' ? 'công thức' : selectedReport.type === 'comment' ? 'bình luận' : 'người dùng'} này không?`)) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('auth_token');
      const endpoint = action === 'delete' 
        ? `http://localhost:5000/api/admin/${selectedReport.type}s/${selectedReport.reported_id}`
        : `http://localhost:5000/api/admin/users/${selectedReport.reported_id}/suspend`;
      
      const method = action === 'delete' ? 'DELETE' : 'POST';
      
      const body = action === 'suspend' 
        ? JSON.stringify({ days: 7, reason: `Phản hồi cho báo cáo #${selectedReport.id}` }) 
        : null;
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        ...(body && { body })
      });
      
      if (!response.ok) {
        throw new Error(`Không thể ${action === 'delete' ? 'xóa' : 'khóa'} ${selectedReport.type}`);
      }
      
      // Đánh dấu báo cáo là đã xử lý
      await handleStatusChange(selectedReport.id, 'resolved');
      
      // Đóng modal
      setShowModal(false);
      
      // Thông báo thành công
      alert(`Đã ${action === 'delete' ? 'xóa' : 'khóa'} thành công!`);
      
    } catch (error) {
      console.error(`Error ${action}:`, error);
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'investigating': return 'badge-info';
      case 'resolved': return 'badge-success';
      case 'rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'recipe': return 'fas fa-utensils';
      case 'comment': return 'fas fa-comment';
      case 'user': return 'fas fa-user';
      default: return 'fas fa-flag';
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Thêm hoặc cập nhật hàm fetchReportDetail
  const fetchReportDetail = async (reportId) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Không thể lấy thông tin báo cáo');
      }
      
      const data = await response.json();
      setSelectedReport(data.data);
    } catch (error) {
      console.error('Error fetching report details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render thông tin chi tiết cho báo cáo người dùng
  const renderUserReportDetails = (report) => (
    <div className="report-details-section">
      <h4>Thông tin người bị báo cáo</h4>
      <div className="detail-item">
        <span className="label">ID người dùng:</span>
        <span className="value">{report.reported_id}</span>
      </div>
      <div className="detail-item">
        <span className="label">Tên người dùng:</span>
        <span className="value">{report.reported_user_name}</span>
      </div>
      <div className="detail-item">
        <span className="label">Email:</span>
        <span className="value">{report.reported_user_email}</span>
      </div>
      
      <h4>Thông tin báo cáo</h4>
      <div className="detail-item">
        <span className="label">Người báo cáo:</span>
        <span className="value">{report.reporter_name} (ID: {report.reporter_id})</span>
      </div>
      <div className="detail-item">
        <span className="label">Lý do:</span>
        <span className="value">{report.reason}</span>
      </div>
      <div className="detail-item">
        <span className="label">Chi tiết:</span>
        <p className="value">{report.details}</p>
      </div>
    </div>
  );

  // Render thông tin chi tiết cho báo cáo comment
  const renderCommentReportDetails = (report) => (
    <div className="report-details-section">
      <h4>Thông tin bình luận bị báo cáo</h4>
      <div className="detail-item">
        <span className="label">ID bình luận:</span>
        <span className="value">{report.reported_id}</span>
      </div>
      <div className="detail-item">
        <span className="label">Nội dung bình luận:</span>
        <p className="value">{report.comment_text}</p>
      </div>
      <div className="detail-item">
        <span className="label">Người viết bình luận:</span>
        <span className="value">{report.comment_author_name} (ID: {report.comment_author_id})</span>
      </div>
      <div className="detail-item">
        <span className="label">Thuộc công thức:</span>
        <span className="value">{report.recipe_title} (ID: {report.recipe_id})</span>
      </div>
      
      <h4>Thông tin báo cáo</h4>
      <div className="detail-item">
        <span className="label">Người báo cáo:</span>
        <span className="value">{report.reporter_name} (ID: {report.reporter_id})</span>
      </div>
      <div className="detail-item">
        <span className="label">Lý do:</span>
        <span className="value">{report.reason}</span>
      </div>
      <div className="detail-item">
        <span className="label">Chi tiết:</span>
        <p className="value">{report.details}</p>
      </div>
    </div>
  );

  // Render thông tin chi tiết cho báo cáo công thức
  const renderRecipeReportDetails = (report) => (
    <div className="report-details-section">
      <h4>Thông tin công thức bị báo cáo</h4>
      <div className="detail-item">
        <span className="label">ID công thức:</span>
        <span className="value">{report.reported_id}</span>
      </div>
      <div className="detail-item">
        <span className="label">Tiêu đề:</span>
        <span className="value">{report.recipe_title}</span>
      </div>
      <div className="detail-item">
        <span className="label">Người đăng:</span>
        <span className="value">{report.recipe_author_name} (ID: {report.recipe_author_id})</span>
      </div>
      
      <h4>Thông tin báo cáo</h4>
      <div className="detail-item">
        <span className="label">Người báo cáo:</span>
        <span className="value">{report.reporter_name} (ID: {report.reporter_id})</span>
      </div>
      <div className="detail-item">
        <span className="label">Lý do:</span>
        <span className="value">{report.reason}</span>
      </div>
      <div className="detail-item">
        <span className="label">Chi tiết:</span>
        <p className="value">{report.details}</p>
      </div>
    </div>
  );

  // Hàm gửi tin nhắn đến admin
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageContent.trim()) {
      alert('Vui lòng nhập nội dung tin nhắn');
      return;
    }
    
    try {
      setSendingMessage(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5000/api/notifications/message-admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageContent
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi gửi tin nhắn');
      }
      
      alert('Tin nhắn đã được gửi đến admin');
      setMessageContent('');
      setShowMessageModal(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="admin-reports-page">
      <h1>Quản lý báo cáo vi phạm</h1>
      
      <div className="reports-filter-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label>Trạng thái:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="investigating">Đang điều tra</option>
              <option value="resolved">Đã giải quyết</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Loại:</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="recipe">Công thức</option>
              <option value="comment">Bình luận</option>
              <option value="user">Người dùng</option>
            </select>
          </div>
        </div>
        
        <form className="search-form" onSubmit={handleSearch}>
          <input 
            type="text"
            placeholder="Tìm kiếm theo ID, người báo cáo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">
            <i className="fas fa-search"></i>
          </button>
        </form>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <i className="far fa-flag"></i>
          <p>Không có báo cáo nào</p>
        </div>
      ) : (
        <>
          <div className="tab-selector">
            <button 
              className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Báo cáo
            </button>
            <button 
              className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              Tin nhắn từ người dùng
            </button>
          </div>
          
          {activeTab === 'reports' ? (
            <>
              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Loại</th>
                      <th>Nội dung báo cáo</th>
                      <th>Người báo cáo</th>
                      <th>Ngày báo cáo</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report.id} className={report.status === 'pending' ? 'highlight' : ''}>
                        <td>{report.id}</td>
                        <td>
                          <span className="type-icon">
                            <i className={getTypeIcon(report.type)}></i>
                          </span>
                          {report.type === 'recipe' ? 'Công thức' : 
                           report.type === 'comment' ? 'Bình luận' : 'Người dùng'}
                        </td>
                        <td className="report-content-cell">
                          <div className="report-reason">{report.reason}</div>
                          <div className="report-target">
                            {report.resource_title || `ID: ${report.reported_id}`}
                          </div>
                        </td>
                        <td>{report.reporter_name}</td>
                        <td>{formatDate(report.created_at)}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                            {report.status === 'pending' ? 'Chờ xử lý' :
                             report.status === 'investigating' ? 'Đang điều tra' :
                             report.status === 'resolved' ? 'Đã giải quyết' :
                             report.status === 'rejected' ? 'Đã từ chối' : report.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="view-btn"
                              onClick={() => handleViewReport(report)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            
                            {report.status === 'pending' && (
                              <button 
                                className="investigate-btn"
                                onClick={() => handleStatusChange(report.id, 'investigating')}
                                title="Đánh dấu đang điều tra"
                              >
                                <i className="fas fa-search"></i>
                              </button>
                            )}
                            
                            {(report.status === 'pending' || report.status === 'investigating') && (
                              <>
                                <button 
                                  className="resolve-btn"
                                  onClick={() => handleStatusChange(report.id, 'resolved')}
                                  title="Đánh dấu đã giải quyết"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                
                                <button 
                                  className="reject-btn"
                                  onClick={() => handleStatusChange(report.id, 'rejected')}
                                  title="Từ chối báo cáo này"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-angle-double-left"></i>
                  </button>
                  
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-angle-left"></i>
                  </button>
                  
                  <span className="page-info">
                    Trang {currentPage} / {totalPages}
                  </span>
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="fas fa-angle-right"></i>
                  </button>
                  
                  <button 
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="fas fa-angle-double-right"></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="messages-container">
              {loading ? (
                <div className="loading-spinner">Đang tải...</div>
              ) : messages.length === 0 ? (
                <div className="no-messages">Không có tin nhắn nào từ người dùng</div>
              ) : (
                <div className="messages-list">
                  {messages.map(message => (
                    <div key={message.id} className="message-item">
                      <div className="message-header">
                        <span className="message-sender">
                          {message.sender_name || `User #${message.sender_id}`}
                        </span>
                        <span className="message-time">
                          {new Date(message.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="message-content">{message.content}</div>
                      <div className="message-actions">
                        <button 
                          className="reply-button"
                          onClick={() => handleReplyMessage(message)}
                        >
                          <i className="fas fa-reply"></i> Phản hồi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {showModal && selectedReport && (
        <div className="report-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết báo cáo #{selectedReport.id}</h2>
              <button className="close-modal" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="report-detail-content">
              <div className="detail-row">
                <span className="detail-label">Loại báo cáo:</span>
                <span className="detail-value">
                  {selectedReport.type === 'recipe' ? 'Công thức' : 
                   selectedReport.type === 'comment' ? 'Bình luận' : 'Người dùng'}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">ID được báo cáo:</span>
                <span className="detail-value">{selectedReport.reported_id}</span>
              </div>
              
              {selectedReport.resource_title && (
                <div className="detail-row">
                  <span className="detail-label">Tiêu đề:</span>
                  <span className="detail-value">{selectedReport.resource_title}</span>
                </div>
              )}
              
              <div className="detail-row">
                <span className="detail-label">Lý do báo cáo:</span>
                <span className="detail-value">{selectedReport.reason}</span>
              </div>
              
              {selectedReport.description && (
                <div className="detail-row">
                  <span className="detail-label">Mô tả chi tiết:</span>
                  <div className="detail-text-block">{selectedReport.description}</div>
                </div>
              )}
              
              <div className="detail-row">
                <span className="detail-label">Người báo cáo:</span>
                <span className="detail-value">
                  {selectedReport.reporter_name} (ID: {selectedReport.reporter_id})
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Thời gian báo cáo:</span>
                <span className="detail-value">{formatDate(selectedReport.created_at)}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Trạng thái:</span>
                <span className={`status-badge ${getStatusBadgeClass(selectedReport.status)}`}>
                  {selectedReport.status === 'pending' ? 'Chờ xử lý' :
                   selectedReport.status === 'investigating' ? 'Đang điều tra' :
                   selectedReport.status === 'resolved' ? 'Đã giải quyết' :
                   selectedReport.status === 'rejected' ? 'Đã từ chối' : selectedReport.status}
                </span>
              </div>
              
              {selectedReport.admin_response && (
                <div className="detail-row">
                  <span className="detail-label">Phản hồi trước đó:</span>
                  <div className="detail-text-block">{selectedReport.admin_response}</div>
                </div>
              )}
              
              <div className="action-links">
                {selectedReport.type === 'recipe' && (
                  <Link to={`/recipe/${selectedReport.reported_id}`} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-external-link-alt"></i> Xem công thức
                  </Link>
                )}
                
                {selectedReport.type === 'user' && (
                  <Link to={`/profile/${selectedReport.reported_id}`} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-external-link-alt"></i> Xem người dùng
                  </Link>
                )}
                
                {selectedReport.type === 'comment' && (
                  <Link to={`/recipe/${selectedReport.recipe_id}`} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-external-link-alt"></i> Xem trong công thức
                  </Link>
                )}
              </div>
              
              {(selectedReport.status === 'pending' || selectedReport.status === 'investigating') && (
                <>
                  <h3 className="response-header">Phản hồi báo cáo</h3>
                  
                  <form onSubmit={handleSendResponse}>
                    <div className="form-group">
                      <label>Nội dung phản hồi:</label>
                      <textarea 
                        rows="4"
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Nhập nội dung phản hồi tới người báo cáo..."
                      ></textarea>
                    </div>
                    
                    <div className="action-buttons-container">
                      <div className="status-actions">
                        <button 
                          type="button"
                          className="resolve-action"
                          onClick={() => handleStatusChange(selectedReport.id, 'resolved')}
                        >
                          <i className="fas fa-check"></i> Đánh dấu đã giải quyết
                        </button>
                        
                        <button 
                          type="button"
                          className="reject-action"
                          onClick={() => handleStatusChange(selectedReport.id, 'rejected')}
                        >
                          <i className="fas fa-times"></i> Từ chối báo cáo
                        </button>
                      </div>
                      
                      <div className="content-actions">
                        <button 
                          type="button"
                          className="delete-action"
                          onClick={() => handleTakeAction('delete')}
                          disabled={submitting}
                        >
                          <i className="fas fa-trash"></i> Xóa {selectedReport.type === 'recipe' ? 'công thức' : selectedReport.type === 'comment' ? 'bình luận' : 'người dùng'}
                        </button>
                        
                        {selectedReport.type === 'user' && (
                          <button 
                            type="button"
                            className="suspend-action"
                            onClick={() => handleTakeAction('suspend')}
                            disabled={submitting}
                          >
                            <i className="fas fa-user-lock"></i> Khóa người dùng
                          </button>
                        )}
                        
                        <button 
                          type="submit"
                          className="respond-action"
                          disabled={submitting || !responseText.trim()}
                        >
                          <i className="fas fa-paper-plane"></i> Gửi phản hồi
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              )}
              
              {/* Thêm phần hiển thị tin nhắn từ người dùng */}
              <div className="user-messages">
                <h3>Tin nhắn từ người dùng</h3>
                {selectedReport.messages && selectedReport.messages.length > 0 ? (
                  <ul className="message-list">
                    {selectedReport.messages.map((msg, index) => (
                      <li key={index} className="message-item">
                        <div className="message-header">
                          <span className="message-sender">{msg.sender_name}</span>
                          <span className="message-time">{formatDate(msg.created_at)}</span>
                        </div>
                        <div className="message-content">{msg.content}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-messages">Chưa có tin nhắn từ người dùng.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;