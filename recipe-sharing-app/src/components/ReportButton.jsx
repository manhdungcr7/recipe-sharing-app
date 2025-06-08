import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ReportButton.css';

const ReportButton = ({ type, id, title }) => {
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reportReasons = {
    recipe: [
      'Nội dung không phù hợp',
      'Nội dung lăng mạ, xúc phạm',
      'Bản quyền/Vi phạm quyền sở hữu',
      'Thông tin không chính xác, gây hiểu lầm',
      'Nội dung độc hại',
      'Khác'
    ],
    comment: [
      'Nội dung lăng mạ, xúc phạm',
      'Spam',
      'Quảng cáo',
      'Thông tin sai sự thật',
      'Khác'
    ],
    user: [
      'Giả mạo danh tính',
      'Quấy rối người dùng khác',
      'Spam hoặc quảng cáo',
      'Khác'
    ]
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/login');
      return;
    }
    setShowModal(true);
  };

  const submitReport = async (e) => {
    e.preventDefault();

    if (!reportReason) {
      setError('Vui lòng chọn lý do báo cáo');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          reported_id: id,
          reason: reportReason,
          description: reportDescription,
          resource_title: title
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể gửi báo cáo');
      }

      setSuccess(true);
      setReportReason('');
      setReportDescription('');

      // Đóng modal sau 1.5 giây
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button 
        className="report-button"
        onClick={handleReport}
        title="Báo cáo vi phạm"
      >
        <i className="fas fa-flag"></i> Báo cáo
      </button>

      {showModal && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <button className="close-modal" onClick={() => setShowModal(false)}>
              <i className="fas fa-times"></i>
            </button>

            <h2>Báo cáo {type === 'recipe' ? 'công thức' : type === 'comment' ? 'bình luận' : 'người dùng'}</h2>
            
            {title && <p className="report-title">"{title}"</p>}

            {success ? (
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                <p>Báo cáo của bạn đã được gửi! Cảm ơn bạn đã giúp chúng tôi xây dựng cộng đồng tốt đẹp hơn.</p>
              </div>
            ) : (
              <form onSubmit={submitReport}>
                {error && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{error}</p>
                  </div>
                )}

                <div className="form-group">
                  <label>Lý do báo cáo:</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn lý do --</option>
                    {reportReasons[type].map((reason, index) => (
                      <option key={index} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Mô tả chi tiết:</label>
                  <textarea 
                    rows="4"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                  ></textarea>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={submitting || !reportReason}
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;