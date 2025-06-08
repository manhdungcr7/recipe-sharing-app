import React, { useState } from 'react';
import './ReportModal.css';

const REPORT_REASONS = {
  recipe: [
    'Nội dung không phù hợp',
    'Vi phạm bản quyền',
    'Thông tin sai lệch hoặc nguy hiểm',
    'Spam hoặc quảng cáo',
    'Khác'
  ],
  comment: [
    'Quấy rối hoặc bắt nạt',
    'Ngôn từ xúc phạm',
    'Spam',
    'Khác'
  ],
  user: [
    'Giả mạo danh tính',
    'Quấy rối nhiều người dùng',
    'Đăng nội dung không phù hợp',
    'Spam',
    'Khác'
  ]
};

const ReportModal = ({ type, id, title, onClose }) => {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      if (!token) {
        throw new Error('Bạn cần đăng nhập để báo cáo');
      }

      const finalReason = reason === 'Khác' ? otherReason : reason;

      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          target_id: id,
          reason: finalReason,
          description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể gửi báo cáo');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  const typeText = {
    recipe: 'công thức',
    comment: 'bình luận',
    user: 'người dùng'
  }[type] || 'nội dung';

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        <h3 className="report-modal-title">
          <i className="fas fa-flag"></i> Báo cáo {typeText}
        </h3>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="report-target">
              <strong>Báo cáo:</strong> {title || `${typeText} #${id}`}
            </div>

            <div className="form-group">
              <label>Lý do báo cáo:</label>
              <select 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">-- Chọn lý do --</option>
                {REPORT_REASONS[type]?.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {reason === 'Khác' && (
              <div className="form-group">
                <label>Lý do khác:</label>
                <input
                  type="text"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Nhập lý do báo cáo của bạn"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Mô tả chi tiết:</label>
              <textarea
                rows="5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Vui lòng mô tả chi tiết vấn đề với ${typeText} này`}
                required
                minLength={10}
              ></textarea>
              <small>Tối thiểu 10 ký tự</small>
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={onClose}
                disabled={submitting}
              >
                Hủy bỏ
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
        ) : (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            <p>Báo cáo của bạn đã được gửi thành công!</p>
            <p>Đội ngũ quản trị viên sẽ xem xét báo cáo này sớm nhất có thể.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;