import React, { useState, useEffect } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
  const { currentUser, isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  
  useEffect(() => {
    // Kiểm tra quyền admin
    const checkAdminAccess = () => {
      if (!loading && (!isAuthenticated || (currentUser && currentUser.role !== 'admin'))) {
        navigate('/login', { state: { message: 'Bạn không có quyền truy cập trang này.' } });
      }
    };
    
    checkAdminAccess();
  }, [currentUser, isAuthenticated, loading, navigate]);

  // Xử lý responsive sidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  // Ẩn sidebar khi click vào content trên mobile
  const handleContentClick = () => {
    if (window.innerWidth <= 768 && showSidebar) {
      setShowSidebar(false);
    }
  };

  // Hiển thị loading khi đang kiểm tra quyền
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  // Nếu không phải admin, chuyển hướng đến trang login
  if (!isAuthenticated || (currentUser && currentUser.role !== 'admin')) {
    return <Navigate to="/login" state={{ message: 'Bạn không có quyền truy cập trang này.' }} />;
  }

  return (
    <div className="admin-layout">
      <AdminHeader toggleSidebar={toggleSidebar} />
      <div className="admin-content-container">
        <AdminSidebar className={showSidebar ? 'show' : ''} />
        <main className="admin-main-content" onClick={handleContentClick}>
          {children || <Outlet />}
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