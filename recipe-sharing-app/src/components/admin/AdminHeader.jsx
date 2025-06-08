import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './AdminHeader.css';

const AdminHeader = ({ toggleSidebar }) => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    
    navigate('/login');
  };

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        {toggleSidebar && (
          <button className="admin-mobile-menu-button" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>
        )}
        
        <div className="admin-logo">
          <Link to="/admin">
            <h1>Recipe Sharing <span>Admin</span></h1>
          </Link>
        </div>
        
        <div className="admin-header-right">
          <div className="admin-user-info">
            <img 
              src={currentUser?.picture 
                ? `http://localhost:5000${currentUser.picture}` 
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Admin')}&background=random`} 
              alt={currentUser?.name}
              className="admin-avatar"
            />
            <span className="admin-username">{currentUser?.name}</span>
          </div>
          
          <div className="admin-actions">
            <Link to="/dashboard" className="admin-view-site">
              <i className="fas fa-external-link-alt"></i> Xem trang chính
            </Link>
            <button onClick={handleLogout} className="admin-logout">
              <i className="fas fa-sign-out-alt"></i> Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;