import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './ReportButton.css';

const ReportButton = ({ type, targetId, id, targetName = '' }) => {
    // State variables
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [reportDetail, setReportDetail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    // Định nghĩa các loại lý do báo cáo
    const reasons = {
        user: [
            'Giả mạo người khác',
            'Nội dung không phù hợp',
            'Quấy rối hoặc bắt nạt',
            'Spam',
            'Khác'
        ],
        comment: [
            'Nội dung xúc phạm',
            'Spam',
            'Thông tin sai lệch',
            'Khác'
        ],
        recipe: [
            'Nội dung không phù hợp',
            'Vi phạm bản quyền',
            'Thông tin sai lệch',
            'Spam',
            'Khác'
        ]
    };

    // Xử lý khi người dùng click vào nút báo cáo
    const handleReportClick = () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setShowReportForm(true);
    };

    // Thêm hàm đóng modal thiếu
    const handleCloseModal = () => {
        setShowReportForm(false);
        setReportReason('');
        setCustomReason('');
        setReportDetail('');
        setError('');
        setSuccess(false);
    };

    // Thêm hàm submit báo cáo
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Kiểm tra giá trị actualId thay vì targetId
        const actualId = targetId || id;
        if (!actualId) {
          setError('ID không hợp lệ');
          return;
        }
        
        // Kiểm tra lý do báo cáo
        const finalReason = reportReason === 'Khác' ? customReason : reportReason;
        if (!finalReason) {
            setError('Vui lòng chọn lý do báo cáo');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            
            // URL báo cáo dựa vào type
            const reportUrl = `http://localhost:5000/api/reports/${type}/${actualId}`;
            
            const response = await fetch(reportUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    reason: finalReason,
                    details: reportDetail
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Không thể gửi báo cáo');
            }

            setSuccess(true);
            setTimeout(handleCloseModal, 2000);
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
                onClick={handleReportClick}
                title={`Báo cáo ${
                  type === 'user' ? 'người dùng' : 
                  type === 'comment' ? 'bình luận' : 'bài đăng'
                }`}
            >
                <i className="fas fa-flag"></i>
                {type === 'user' && <span>Báo cáo</span>}
            </button>

            {showReportForm && (
                <div className="report-modal-overlay">
                    <div className="report-modal">
                        <div className="report-modal-header">
                          <h3>Báo cáo {
                            type === 'user' ? 'người dùng' : 
                            type === 'comment' ? 'bình luận' : 'bài đăng'
                          }{targetName ? `: ${targetName}` : ''}</h3>
                          <button className="close-btn" onClick={handleCloseModal}>×</button>
                        </div>
                        
                        {success ? (
                          <div className="report-success">
                            <i className="fas fa-check-circle"></i>
                            <p>Báo cáo đã được gửi thành công!</p>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmit} className="report-form">
                            <div className="form-group">
                              <label>Lý do báo cáo:</label>
                              <select 
                                value={reportReason} 
                                onChange={(e) => setReportReason(e.target.value)}
                                required
                              >
                                <option value="">-- Chọn lý do --</option>
                                {reasons[type].map(reason => (
                                  <option key={reason} value={reason}>
                                    {reason}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {reportReason === 'Khác' && (
                              <div className="form-group">
                                <label>Lý do khác:</label>
                                <input
                                  type="text"
                                  value={customReason}
                                  onChange={(e) => setCustomReason(e.target.value)}
                                  placeholder="Nhập lý do báo cáo"
                                  required
                                />
                              </div>
                            )}
                            
                            <div className="form-group">
                              <label>Chi tiết báo cáo:</label>
                              <textarea
                                value={reportDetail}
                                onChange={(e) => setReportDetail(e.target.value)}
                                placeholder="Mô tả chi tiết về vấn đề bạn phát hiện..."
                                rows="4"
                                required
                              ></textarea>
                            </div>
                            
                            {error && <p className="error-message">{error}</p>}
                            
                            <div className="form-actions">
                              <button 
                                type="button" 
                                className="cancel-btn"
                                onClick={handleCloseModal}
                                disabled={submitting}
                              >
                                Hủy
                              </button>
                              <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={submitting}
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