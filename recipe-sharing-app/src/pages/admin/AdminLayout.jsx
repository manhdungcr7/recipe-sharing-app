import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
  const [showSidebar, setShowSidebar] = useState(true); // Mặc định hiển thị sidebar trên desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Kiểm tra kích thước màn hình khi component mount và khi resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Tự động ẩn sidebar trên mobile
      if (mobile && showSidebar) {
        setShowSidebar(false);
      } else if (!mobile && !showSidebar) {
        setShowSidebar(true);
      }
    };
    
    // Thêm event listener
    window.addEventListener('resize', handleResize);
    
    // Gọi một lần lúc đầu
    handleResize();
    
    // Cleanup khi unmount
    return () => window.removeEventListener('resize', handleResize);
  }, [showSidebar]);
  
  // Mặc định hiển thị sidebar khi tải trang
  useEffect(() => {
    setSidebarExpanded(true);
  }, []);
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };
  
  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="admin-content-wrapper">
        <AdminSidebar />
        <div className="admin-content-container">
          <main className="admin-main-content">
            {children || <Outlet />}
          </main>
        </div>
      </div>
      <button 
        className="show-sidebar-btn"
        onClick={toggleSidebar}
        style={{
          position: 'fixed',
          top: '70px',
          left: '10px',
          zIndex: 1000,
          background: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
      >
        <i className="fas fa-bars"></i>
      </button>
    </div>
  );
};

export default AdminLayout;