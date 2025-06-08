import React, { ReactNode, useState } from 'react';
import AdminHeader from '../admin/AdminHeader.jsx';
import AdminSidebar from '../admin/AdminSidebar.jsx';
import './AdminLayout.css';

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Xử lý responsive sidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  return (
    <div className="admin-layout">
      <AdminHeader toggleSidebar={toggleSidebar} />
      <div className="admin-content">
        <AdminSidebar />
        <main className="admin-main-content">
          {children}
        </main>
      </div>
      
      {window.innerWidth <= 768 && (
        <button className="admin-sidebar-toggle" onClick={toggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
      )}
    </div>
  );
};

export default AdminLayout;