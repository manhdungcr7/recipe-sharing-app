import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = ({ className, isExpanded }) => {
  console.log("AdminSidebar - isExpanded:", isExpanded); // Log để debug
  const location = useLocation();

  return (
    <div className={`admin-sidebar ${className || ''} ${isExpanded ? 'show' : 'hide'}`}>
      <nav className="sidebar-nav">
        <ul className="menu-list">
          <li className="menu-section">Dashboard</li>
          <li className="menu-item">
            <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
              <span className="menu-icon">
                <i className="fas fa-tachometer-alt"></i>
              </span>
              <span className="menu-text">Tổng quan</span>
            </NavLink>
          </li>
          
          <li className="menu-section">Quản lý</li>
          <li className="menu-item">
            <NavLink to="/admin/users" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
              <span className="menu-icon">
                <i className="fas fa-users"></i>
              </span>
              <span className="menu-text">Người dùng</span>
            </NavLink>
          </li>
          
          <li className="menu-item">
            <NavLink to="/admin/recipes" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
              <span className="menu-icon">
                <i className="fas fa-utensils"></i>
              </span>
              <span className="menu-text">Công thức</span>
            </NavLink>
          </li>
          
          <li className="menu-item">
            <NavLink to="/admin/reports" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
              <span className="menu-icon">
                <i className="fas fa-flag"></i>
              </span>
              <span className="menu-text">Báo cáo</span>
            </NavLink>
          </li>
          
          <li className="menu-section">Giao tiếp</li>
          <li className="menu-item">
            <NavLink to="/admin/messages" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
              <span className="menu-icon">
                <i className="fas fa-envelope"></i>
              </span>
              <span className="menu-text">Tin nhắn</span>
            </NavLink>
          </li>
          
          <li className="menu-section">Hệ thống</li>
          <li className="menu-item">
            <NavLink to="/admin/settings" className={({isActive}) => isActive ? "menu-link active" : "menu-link"}>
              <span className="menu-icon">
                <i className="fas fa-cog"></i>
              </span>
              <span className="menu-text">Cài đặt</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;