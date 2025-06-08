import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../components/admin/AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers: 0,
    totalRecipes: 0,
    pendingRecipes: 0,
    totalReports: 0,
    unresolvedReports: 0
  });
  
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        
        // Lấy thống kê tổng quan
        const statsResponse = await fetch('http://localhost:5000/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Lấy người dùng mới nhất
        const usersResponse = await fetch('http://localhost:5000/api/admin/users/recent', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Lấy công thức mới nhất
        const recipesResponse = await fetch('http://localhost:5000/api/admin/recipes/recent', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!statsResponse.ok || !usersResponse.ok || !recipesResponse.ok) {
          throw new Error('Không thể tải dữ liệu thống kê');
        }
        
        const statsData = await statsResponse.json();
        const usersData = await usersResponse.json();
        const recipesData = await recipesResponse.json();
        
        setStats(statsData.data || {
          totalUsers: 23,
          newUsers: 5,
          totalRecipes: 48,
          pendingRecipes: 7,
          totalReports: 3,
          unresolvedReports: 2
        });
        
        setRecentUsers(usersData.data || []);
        setRecentRecipes(recipesData.data || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
        
        // Dữ liệu mẫu để hiển thị UI khi API lỗi
        setStats({
          totalUsers: 23,
          newUsers: 5,
          totalRecipes: 48,
          pendingRecipes: 7,
          totalReports: 3,
          unresolvedReports: 2
        });
        
        setRecentUsers([
          { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', is_verified: true, created_at: new Date() },
          { id: 2, name: 'Trần Thị B', email: 'tranthib@example.com', is_verified: false, created_at: new Date() }
        ]);
        
        setRecentRecipes([
          { id: 1, title: 'Bánh mì Việt Nam', author_name: 'Nguyễn Văn A', status: 'published', created_at: new Date() },
          { id: 2, title: 'Phở bò', author_name: 'Trần Thị B', status: 'pending_review', created_at: new Date() }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h1>Tổng quan hệ thống</h1>
      
      {/* Thống kê */}
      <div className="stats-grid">
        <div className="stat-card users-stat">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Người dùng</p>
            <small>{stats.newUsers} người dùng mới trong 7 ngày qua</small>
          </div>
        </div>
        
        <div className="stat-card recipes-stat">
          <div className="stat-icon">
            <i className="fas fa-utensils"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalRecipes}</h3>
            <p>Công thức</p>
            <small>{stats.pendingRecipes} công thức đang chờ duyệt</small>
          </div>
        </div>
        
        <div className="stat-card reports-stat">
          <div className="stat-icon">
            <i className="fas fa-flag"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalReports}</h3>
            <p>Báo cáo</p>
            <small>{stats.unresolvedReports} báo cáo chưa xử lý</small>
          </div>
        </div>
      </div>
      
      {/* Người dùng mới nhất */}
      <div className="admin-section">
        <div className="section-header">
          <h2>Người dùng mới nhất</h2>
          <Link to="/admin/users" className="view-all">Xem tất cả</Link>
        </div>
        
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length > 0 ? recentUsers.map(user => (
                <tr key={user.id}>
                  <td className="user-info">
                    <img 
                      src={user.picture ? `http://localhost:5000${user.picture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                      alt={user.name}
                      className="user-avatar-small"
                    />
                    <span>{user.name}</span>
                  </td>
                  <td>{user.email}</td>
                  <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`status-badge ${user.is_verified ? 'verified' : 'unverified'}`}>
                      {user.is_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4">Không có dữ liệu người dùng mới</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Công thức mới nhất */}
      <div className="admin-section">
        <div className="section-header">
          <h2>Công thức mới nhất</h2>
          <Link to="/admin/recipes" className="view-all">Xem tất cả</Link>
        </div>
        
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Tác giả</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentRecipes.length > 0 ? recentRecipes.map(recipe => (
                <tr key={recipe.id}>
                  <td className="recipe-info">
                    <img 
                      src={recipe.image_url ? `http://localhost:5000${recipe.image_url}` : 'https://via.placeholder.com/40'} 
                      alt={recipe.title}
                      className="recipe-image-small"
                    />
                    <span>{recipe.title}</span>
                  </td>
                  <td>{recipe.author_name}</td>
                  <td>{new Date(recipe.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`status-badge ${recipe.status}`}>
                      {recipe.status === 'published' ? 'Đã xuất bản' : 
                       recipe.status === 'pending_review' ? 'Chờ duyệt' : 
                       recipe.status === 'rejected' ? 'Đã từ chối' : 'Bản nháp'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4">Không có dữ liệu công thức mới</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;