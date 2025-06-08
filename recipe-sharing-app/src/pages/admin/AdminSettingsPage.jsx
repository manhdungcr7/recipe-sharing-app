import React, { useState, useEffect } from 'react';
import './AdminSettingsPage.css';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    siteName: 'Recipe Sharing',
    siteDescription: 'Nền tảng chia sẻ công thức nấu ăn',
    maintenanceMode: false,
    userRegistration: true,
    moderationEnabled: true,
    autoPublish: false,
    maxUploadSize: 5,
    featuredCategories: '',
    sensitiveWords: '',
    contactEmail: 'contact@recipesharing.com'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch('http://localhost:5000/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Không thể tải cài đặt hệ thống');
        }
        
        const data = await response.json();
        setSettings(data.data || settings);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Không thể tải cài đặt hệ thống. Dùng giá trị mặc định.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('http://localhost:5000/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error('Không thể lưu cài đặt hệ thống');
      }
      
      setSuccess('Cài đặt hệ thống đã được cập nhật thành công');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Reset settings to default
  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả cài đặt về mặc định?')) {
      setSettings({
        siteName: 'Recipe Sharing',
        siteDescription: 'Nền tảng chia sẻ công thức nấu ăn',
        maintenanceMode: false,
        userRegistration: true,
        moderationEnabled: true,
        autoPublish: false,
        maxUploadSize: 5,
        featuredCategories: '',
        sensitiveWords: '',
        contactEmail: 'contact@recipesharing.com'
      });
    }
  };
  
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Đang tải cài đặt...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-settings">
      <div className="admin-page-header">
        <h1>Cài đặt hệ thống</h1>
      </div>
      
      {error && (
        <div className="admin-error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {success && (
        <div className="admin-success-message">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-section">
          <h3>Cài đặt chung</h3>
          
          <div className="form-group">
            <label htmlFor="siteName">Tên trang web</label>
            <input
              type="text"
              id="siteName"
              name="siteName"
              value={settings.siteName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="siteDescription">Mô tả trang web</label>
            <textarea
              id="siteDescription"
              name="siteDescription"
              value={settings.siteDescription}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="contactEmail">Email liên hệ</label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={settings.contactEmail}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Cài đặt người dùng và nội dung</h3>
          
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="userRegistration"
              name="userRegistration"
              checked={settings.userRegistration}
              onChange={handleChange}
            />
            <label htmlFor="userRegistration">Cho phép đăng ký người dùng mới</label>
          </div>
          
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="moderationEnabled"
              name="moderationEnabled"
              checked={settings.moderationEnabled}
              onChange={handleChange}
            />
            <label htmlFor="moderationEnabled">Yêu cầu kiểm duyệt công thức mới</label>
          </div>
          
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="autoPublish"
              name="autoPublish"
              checked={settings.autoPublish}
              onChange={handleChange}
              disabled={settings.moderationEnabled}
            />
            <label htmlFor="autoPublish" className={settings.moderationEnabled ? 'disabled' : ''}>
              Tự động xuất bản công thức mới (không cần kiểm duyệt)
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="maxUploadSize">Kích thước tối đa tệp tải lên (MB)</label>
            <input
              type="number"
              id="maxUploadSize"
              name="maxUploadSize"
              value={settings.maxUploadSize}
              onChange={handleChange}
              min="1"
              max="20"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="featuredCategories">Danh mục nổi bật (ngăn cách bằng dấu phẩy)</label>
            <input
              type="text"
              id="featuredCategories"
              name="featuredCategories"
              value={settings.featuredCategories}
              onChange={handleChange}
              placeholder="VD: Món Việt, Đồ ngọt, Món chay"
            />
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Bảo mật và kiểm soát nội dung</h3>
          
          <div className="form-group">
            <label htmlFor="sensitiveWords">Từ khóa nhạy cảm cần lọc (ngăn cách bằng dấu phẩy)</label>
            <textarea
              id="sensitiveWords"
              name="sensitiveWords"
              value={settings.sensitiveWords}
              onChange={handleChange}
              placeholder="Nhập các từ khóa nhạy cảm cần lọc"
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="maintenanceMode"
              name="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={handleChange}
            />
            <label htmlFor="maintenanceMode">Bật chế độ bảo trì</label>
            <p className="form-helper">
              Khi bật chế độ bảo trì, chỉ quản trị viên mới có thể truy cập trang web.
            </p>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-reset" onClick={handleReset}>
            Đặt lại mặc định
          </button>
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;