import React, { useEffect, useState } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import AdminSidebar from "../admin/AdminSidebar";
import AdminHeader from "../admin/AdminHeader";
import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
  const { currentUser, isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  // Thêm hàm toggleSidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Kiểm tra quyền admin
  useEffect(() => {
    const checkAdminAccess = () => {
      if (!loading && (!isAuthenticated || (currentUser && currentUser.role !== 'admin'))) {
        navigate('/login', { state: { message: 'Bạn không có quyền truy cập trang này.' } });
      }
    };

    checkAdminAccess();
  }, [currentUser, isAuthenticated, loading, navigate]);

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
        <main className="admin-main-content">
          {children || <Outlet />}
        </main>
      </div>

      {/* Thêm nút toggle menu trên mobile */}
      <button className="admin-sidebar-toggle" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>
    </div>
  );
};

export default AdminLayout;
