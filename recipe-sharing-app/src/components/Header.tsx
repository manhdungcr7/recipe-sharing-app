import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, User } from '../context/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { isAuthenticated, currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">Recipe Sharing</Link>
        </div>
        <nav className="main-nav">
          <ul>
            {isAuthenticated && (
              <>
                <li><Link to="/search">Tìm kiếm</Link></li>
                <li><Link to="/create-recipe">Tạo công thức</Link></li>
              </>
            )}
          </ul>
        </nav>
        <div className="user-actions">
          {isAuthenticated ? (
            <div className="user-menu">
              <Link to={`/profile/${currentUser?.id}`} className="user-profile">
                <img 
                  src={currentUser?.picture || '/default-avatar.jpg'} 
                  alt={currentUser?.name || 'User'}
                  onError={(e) => {(e.target as HTMLImageElement).src = '/default-avatar.jpg'}}
                />
                <span>{currentUser?.name || 'Người dùng'}</span>
              </Link>
              <button onClick={handleLogout} className="logout-button">
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-button">Đăng nhập</Link>
              <Link to="/register" className="register-button">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;