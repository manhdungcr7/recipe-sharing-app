import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './ReportUserPage.css';

const ReportUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if logged in
    if (!isAuthenticated) {
      alert('Bạn cần đăng nhập để báo cáo người dùng');
      navigate('/login');
      return;
    }

    // Cannot report yourself
    if (currentUser && currentUser.id === parseInt(id)) {
      setError('Bạn không thể báo cáo chính mình');
      setLoading(false);
      return;
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/users/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Không tìm thấy người dùng');
          }
          throw new Error('Không thể tải thông tin người dùng');
        }

        const data = await response.json();
        setUserData(data.data);
      } catch (err) {
        setError(err.message || 'Đã có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, isAuthenticated, navigate, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!reason) {
      setError('Vui lòng chọn lý do báo cáo');
      return;
    }

    if (reason === 'Khác' && !otherReason) {
      setError('Vui lòng nhập lý do khác');
      return;
    }

    if (!description || description.trim().length < 10) {
      setError('Vui lòng nhập mô tả chi tiết (ít nhất 10 ký tự)');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const finalReason = reason === 'Khác' ? otherReason : reason;

      const response = await fetch(`http://localhost:5000/api/reports/user/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: finalReason,
          details: description  // Đổi "description" thành "details" để khớp với controller
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể gửi báo cáo');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải thông tin người dùng...</p>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="error-container">
        <h2>Không thể tải thông tin</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Quay lại</button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="success-container">
        <div className="success-icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <h2>Báo cáo đã được gửi thành công!</h2>
        <p>Đội ngũ quản trị viên sẽ xem xét báo cáo của bạn sớm nhất có thể.</p>
        <div className="success-actions">
          <button onClick={() => navigate(-1)} className="back-button">Quay lại</button>
          <button onClick={() => navigate('/dashboard')} className="home-button">Về trang chủ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-user-page">
      <div className="page-header">
        <div className="container">
          <h1>Báo cáo người dùng</h1>
        </div>
      </div>

      <div className="container">
        <div className="report-user-container">
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <div className="user-info">
            <div className="user-avatar">
              {userData.picture ? (
                <img 
                  src={userData.picture.startsWith('http') 
                    ? userData.picture 
                    : `http://localhost:5000${userData.picture}`} 
                  alt={userData.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/150?text=User';
                  }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <div className="user-details">
              <h2>{userData.name}</h2>
              <p>ID: {userData.id}</p>
              <p>Thành viên từ: {new Date(userData.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reason">Lý do báo cáo <span className="required">*</span></label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">-- Chọn lý do --</option>
                <option value="Giả mạo danh tính">Giả mạo danh tính</option>
                <option value="Quấy rối nhiều người dùng">Quấy rối nhiều người dùng</option>
                <option value="Đăng nội dung không phù hợp">Đăng nội dung không phù hợp</option>
                <option value="Spam">Spam</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            {reason === 'Khác' && (
              <div className="form-group">
                <label htmlFor="otherReason">Lý do khác <span className="required">*</span></label>
                <input
                  type="text"
                  id="otherReason"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Vui lòng nhập lý do báo cáo"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="description">Mô tả chi tiết <span className="required">*</span></label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vui lòng cung cấp thông tin chi tiết về hành vi vi phạm của người dùng này"
                rows="5"
                required
                minLength={10}
              ></textarea>
              <small>Tối thiểu 10 ký tự</small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                <i className="fas fa-times"></i> Hủy bỏ
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Đang gửi...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> Gửi báo cáo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportUserPage;