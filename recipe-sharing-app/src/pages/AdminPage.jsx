import React from 'react';

const AdminPage = () => {
  return (
    <div>
      <h2>Quản lý hệ thống</h2>
      
      <div style={{ marginTop: "20px" }}>
        <h3>Quản lý người dùng</h3>
        <div style={{ 
          padding: "15px", 
          backgroundColor: "#f1f1f1", 
          borderRadius: "4px" 
        }}>
          <p>Chưa có dữ liệu người dùng</p>
        </div>
      </div>
      
      <div style={{ marginTop: "20px" }}>
        <h3>Quản lý công thức</h3>
        <div style={{ 
          padding: "15px", 
          backgroundColor: "#f1f1f1", 
          borderRadius: "4px" 
        }}>
          <p>Chưa có dữ liệu công thức</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;