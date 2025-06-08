import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, User } from '../context/AuthContext';
import './AdminHeader.css';

const AdminHeader: React.FC = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        <div className="admin-logo">
          <Link to="/admin">Recipe Sharing Admin</Link>
        </div>
        <div className="admin-user-actions">
          <div className="admin-user-info">
            <img 
              src={currentUser?.picture || '/default-avatar.jpg'} 
              alt={currentUser?.name || 'Admin'} 
              className="admin-user-avatar"
              onError={(e) => {(e.target as HTMLImageElement).src = '/default-avatar.jpg'}}
            />
            <span>{currentUser?.name || 'Admin'}</span>
          </div>
          <button onClick={handleLogout} className="admin-logout-button">
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;