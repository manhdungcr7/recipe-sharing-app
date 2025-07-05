import React from 'react';
import { Link } from 'react-router-dom';
import './AdminHeader.css';

const AdminHeader = ({ toggleSidebar, isExpanded }) => {
  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button 
          className="header-toggle-btn" 
          onClick={toggleSidebar}
          title={isExpanded ? "Ẩn thanh bên" : "Hiện thanh bên"}
        >
          <i className={`fas ${isExpanded ? 'fa-times' : 'fa-bars'}`}></i>
          {isExpanded ? "Đóng thanh bên" : "Hiện thanh bên"}
        </button>
        
        <Link to="/admin/dashboard" className="admin-logo">
          <i className="fas fa-utensils"></i>
          <span>Recipe Sharing Admin</span>
        </Link>
      </div>
      
      <div className="admin-header-right">
        <Link to="/" className="view-site-btn" target="_blank">
          <i className="fas fa-external-link-alt"></i>
          <span>Xem website</span>
        </Link>
        
        <div className="admin-user-info">
          <span>{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'Admin'}</span>
          <img 
            src={localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).picture 
              ? `http://localhost:5000${JSON.parse(localStorage.getItem('user')).picture}` 
              : '/default-avatar.jpg'} 
            alt="Admin" 
            className="admin-avatar" 
          />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;