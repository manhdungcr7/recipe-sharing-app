import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = () => {
  // Danh sách các menu item
  const menuItems = [
    { path: '/admin', label: 'Tổng quan', icon: 'fa-tachometer-alt' },
    { path: '/admin/users', label: 'Người dùng', icon: 'fa-users' },
    { path: '/admin/recipes', label: 'Công thức', icon: 'fa-utensils' },
    { path: '/admin/categories', label: 'Danh mục', icon: 'fa-list' },
    { path: '/admin/reports', label: 'Báo cáo', icon: 'fa-flag' },
    { path: '/admin/settings', label: 'Cài đặt', icon: 'fa-cog' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-content">
        <nav className="admin-nav">
          <ul>
            {menuItems.map((item, index) => (
              <li key={index}>
                <NavLink 
                  to={item.path}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  end={item.path === '/admin'}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="admin-sidebar-footer">
          <p>© {new Date().getFullYear()} Recipe Sharing</p>
          <p>Phiên bản 1.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;