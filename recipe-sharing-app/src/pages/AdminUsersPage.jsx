import React, { useState, useEffect } from 'react';


const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Lấy token từ localStorage
        const token = localStorage.getItem('auth_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // Call API để lấy danh sách người dùng
        const response = await fetch('http://localhost:5000/api/admin/users', {
          headers
        });
        
        if (!response.ok) {
          throw new Error('Không thể lấy danh sách người dùng');
        }
        
        const data = await response.json();
        setUsers(data.data || []);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách người dùng:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này không?')) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Xóa người dùng khỏi danh sách
          setUsers(users.filter(user => user.id !== userId));
        }
      } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
      }
    }
  };

  const handleToggleAdmin = async (user) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: user.role === 'admin' ? 'user' : 'admin'
        })
      });
      
      if (response.ok) {
        // Cập nhật danh sách người dùng
        setUsers(users.map(u => 
          u.id === user.id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u
        ));
      }
    } catch (error) {
      console.error('Lỗi khi thay đổi quyền người dùng:', error);
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="admin-users-page">
      <h2>Quản lý người dùng</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {users.length === 0 ? (
        <div className="no-users">
          <p>Không có người dùng nào</p>
        </div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role === 'admin' ? 'Admin' : 'Người dùng'}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="action-buttons">
                  <button 
                    onClick={() => handleToggleAdmin(user)}
                    className={user.role === 'admin' ? 'remove-admin-button' : 'make-admin-button'}
                  >
                    {user.role === 'admin' ? 'Hủy quyền Admin' : 'Cấp quyền Admin'}
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="delete-button"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsersPage;