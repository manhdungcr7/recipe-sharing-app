import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
  // Mặc định, sidebar bị ẩn (false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  
  // Hàm toggle sidebar
  const toggleSidebar = () => {
    setSidebarExpanded(prev => !prev);
    console.log("Sidebar is now:", !sidebarExpanded);
  };

  return (
    <div className="admin-layout">
      <AdminHeader 
        toggleSidebar={toggleSidebar} 
        isExpanded={sidebarExpanded} 
      />
      <AdminSidebar isExpanded={sidebarExpanded} />
      <div className={`admin-content-container ${sidebarExpanded ? '' : 'expanded'}`}>
        <main className="admin-main-content">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;