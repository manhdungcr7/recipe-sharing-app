import React, { useContext } from "react";
import { Outlet, useLocation, Link } from "react-router-dom"; // Thêm Link
import { AuthContext } from "../../context/AuthContext";
import Header from "../common/Header.jsx";
import Footer from "../common/Footer.jsx";
import "./MainLayout.css";

// Thêm React.memo để tránh re-render không cần thiết
const MainLayout = React.memo(({ children }) => {
  const { currentUser, isAuthenticated } = useContext(AuthContext);

  // Sử dụng useLocation để xác định đường dẫn hiện tại
  const location = useLocation();
  const isNestedLayout = location.pathname.includes('/profile/') && document.querySelectorAll('.main-layout').length > 1;
  
  // Vô hiệu hóa hiệu ứng cuộn (scroll) mượt làm rung header
  React.useEffect(() => {
    // Lưu giá trị scroll behavior hiện tại
    const originalStyle = window.getComputedStyle(document.documentElement).scrollBehavior;

    // Đặt scroll behavior thành "auto" để tránh animation cuộn mượt
    document.documentElement.style.scrollBehavior = "auto";

    return () => {
      // Khôi phục giá trị ban đầu khi component unmount
      document.documentElement.style.scrollBehavior = originalStyle;
    };
  }, []);

  // Kiểm tra nếu đã có main-layout trong DOM, và đang ở trang profile
  // thì không render lại header và footer
  if (isNestedLayout) {
    return (
      <div className="content-only-layout">
        {children || <Outlet />}
      </div>
    );
  }

  // Tạo initials từ tên người dùng
  const getInitials = (name) => {
    if (!name) return "U";
    
    const names = name.split(" ");
    if (names.length > 1) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Render layout đầy đủ trong trường hợp bình thường
  return (
    <div className="main-layout">
      <Header /> {/* Chỉ có một Header duy nhất */}
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
});

export default MainLayout;
