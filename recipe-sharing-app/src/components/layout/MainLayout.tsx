import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../common/Header.jsx';  // Sửa đường dẫn
import Footer from '../common/Footer.jsx';  // Sửa đường dẫn
import './MainLayout.css';

// Định nghĩa interface cho props
interface MainLayoutProps {
  children?: ReactNode;
}

// Thêm type cho props
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-content">
        {/* Hiển thị children nếu được truyền vào, nếu không thì hiển thị Outlet */}
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;