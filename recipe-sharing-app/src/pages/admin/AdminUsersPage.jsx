import React, { useState, useEffect } from 'react';
import './AdminUsersPage.css';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [modalType, setModalType] = useState('');

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // Xây dựng query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      if (searchQuery) params.append('search', searchQuery);
      if (filterRole !== 'all') params.append('role', filterRole);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      // Gọi API với các bộ lọc
      const response = await fetch(`http://localhost:5000/api/admin/users?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách người dùng');
      }
      
      const data = await response.json();
      setUsers(data.data || []);
      setTotalPages(data.pagination.totalPages || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, filterRole, filterStatus]);

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1);
  };

  // Xử lý chọn người dùng
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Xử lý chọn tất cả người dùng
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  // Xử lý hành động hàng loạt
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      
      let endpoint = '';
      switch (bulkAction) {
        case 'delete':
          endpoint = '/api/admin/users/batch-delete';
          break;
        case 'verify':
          endpoint = '/api/admin/users/batch-verify';
          break;
        case 'make-admin':
          endpoint = '/api/admin/users/batch-make-admin';
          break;
        case 'remove-admin':
          endpoint = '/api/admin/users/batch-remove-admin';
          break;
        default:
          return;
      }
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds: selectedUsers })
      });
      
      if (!response.ok) {
        throw new Error('Không thể thực hiện hành động hàng loạt');
      }
      
      // Làm mới danh sách
      fetchUsers(currentPage);
      setSelectedUsers([]);
      setBulkAction('');
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError(err.message);
    }
  };

  // Xử lý chuyển trang
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  // Hiển thị modal chi tiết người dùng
  const showUserDetails = (user) => {
    setModalUser(user);
    setModalType('details');
    setShowModal(true);
  };

  // Hiển thị modal sửa thông tin người dùng
  const showEditUser = (user) => {
    setModalUser({...user});
    setModalType('edit');
    setShowModal(true);
  };

  // Xử lý xóa người dùng
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Không thể xóa người dùng');
      }
      
      // Cập nhật danh sách
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message);
    }
  };

  // Xử lý thay đổi vai trò người dùng
  const handleToggleRole = async (userId, currentRole) => {
    try {
      const token = localStorage.getItem('auth_token');
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!response.ok) {
        throw new Error('Không thể thay đổi vai trò người dùng');
      }
      
      // Cập nhật danh sách
      setUsers(users.map(user => 
        user.id === userId ? {...user, role: newRole} : user
      ));
    } catch (err) {
      console.error('Error changing user role:', err);
      setError(err.message);
    }
  };

  // Xử lý cập nhật thông tin người dùng từ modal
  const handleUpdateUser = async (updatedUser) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedUser)
      });
      
      if (!response.ok) {
        throw new Error('Không thể cập nhật thông tin người dùng');
      }
      
      // Cập nhật danh sách
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      
      setShowModal(false);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Đang tải danh sách người dùng...</p>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="admin-page-header">
        <h1>Quản lý người dùng</h1>
        <button className="btn-add" onClick={() => {
          setModalUser({
            name: '',
            email: '',
            role: 'user',
            is_verified: 1
          });
          setModalType('add');
          setShowModal(true);
        }}>
          <i className="fas fa-plus"></i> Thêm người dùng
        </button>
      </div>

      {/* Filters and Search */}
      <div className="admin-tools">
        <div className="admin-filters">
          <div className="filter">
            <label>Vai trò:</label>
            <select value={filterRole} onChange={(e) => {
              setFilterRole(e.target.value);
              setCurrentPage(1);
            }}>
              <option value="all">Tất cả</option>
              <option value="admin">Admin</option>
              <option value="user">Người dùng</option>
            </select>
          </div>
          
          <div className="filter">
            <label>Trạng thái:</label>
            <select value={filterStatus} onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}>
              <option value="all">Tất cả</option>
              <option value="verified">Đã xác minh</option>
              <option value="unverified">Chưa xác minh</option>
            </select>
          </div>
        </div>
        
        <form className="admin-search" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Tìm theo tên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">
            <i className="fas fa-search"></i>
          </button>
        </form>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedUsers.length} người dùng đã chọn</span>
          <select 
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="">-- Chọn hành động --</option>
            <option value="delete">Xóa</option>
            <option value="verify">Xác minh</option>
            <option value="make-admin">Cấp quyền Admin</option>
            <option value="remove-admin">Hủy quyền Admin</option>
          </select>
          <button 
            className="btn-apply"
            disabled={!bulkAction}
            onClick={handleBulkAction}
          >
            Áp dụng
          </button>
          <button className="btn-clear" onClick={() => setSelectedUsers([])}>
            Bỏ chọn
          </button>
        </div>
      )}

      {error && (
        <div className="admin-error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="admin-table-responsive">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày đăng ký</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  {searchQuery || filterRole !== 'all' || filterStatus !== 'all' ? 
                    'Không tìm thấy người dùng nào phù hợp' : 
                    'Chưa có người dùng nào'
                  }
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td>{user.id}</td>
                  <td className="user-info">
                    <img 
                      src={user.picture ? `http://localhost:5000${user.picture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                      alt={user.name}
                      className="user-avatar-small"
                    />
                    <span>{user.name}</span>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'admin' ? 'Admin' : 'Người dùng'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_verified ? 'verified' : 'unverified'}`}>
                      {user.is_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="actions">
                    <button className="btn-view" onClick={() => showUserDetails(user)}>
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="btn-edit" onClick={() => showEditUser(user)}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-role" onClick={() => handleToggleRole(user.id, user.role)}>
                      {user.role === 'admin' ? 
                        <i className="fas fa-user" title="Hủy quyền Admin"></i> : 
                        <i className="fas fa-user-shield" title="Cấp quyền Admin"></i>
                      }
                    </button>
                    <button className="btn-delete" onClick={() => handleDeleteUser(user.id)}>
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button 
            onClick={() => handlePageChange(1)} 
            disabled={currentPage === 1}
          >
            <i className="fas fa-angle-double-left"></i>
          </button>
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
          >
            <i className="fas fa-angle-left"></i>
          </button>
          
          <div className="pagination-info">
            Trang {currentPage} / {totalPages}
          </div>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
          >
            <i className="fas fa-angle-right"></i>
          </button>
          <button 
            onClick={() => handlePageChange(totalPages)} 
            disabled={currentPage === totalPages}
          >
            <i className="fas fa-angle-double-right"></i>
          </button>
        </div>
      )}

      {/* Modal (Details/Edit/Add) */}
      {showModal && (
        <div className="admin-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {modalType === 'details' ? 'Chi tiết người dùng' : 
                 modalType === 'edit' ? 'Chỉnh sửa người dùng' : 
                 'Thêm người dùng mới'}
              </h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {modalType === 'details' ? (
                // Chi tiết người dùng
                <div className="user-details">
                  <div className="user-avatar-large">
                    <img 
                      src={modalUser.picture ? `http://localhost:5000${modalUser.picture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(modalUser.name)}&background=random&size=200`}
                      alt={modalUser.name}
                    />
                  </div>
                  <div className="user-info-details">
                    <div className="info-item">
                      <span className="label">ID:</span>
                      <span className="value">{modalUser.id}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Họ tên:</span>
                      <span className="value">{modalUser.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Email:</span>
                      <span className="value">{modalUser.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Vai trò:</span>
                      <span className="value role-badge">{modalUser.role === 'admin' ? 'Admin' : 'Người dùng'}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Trạng thái:</span>
                      <span className="value">{modalUser.is_verified ? 'Đã xác minh' : 'Chưa xác minh'}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Ngày đăng ký:</span>
                      <span className="value">{new Date(modalUser.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Số công thức:</span>
                      <span className="value">{modalUser.recipeCount || 0}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Người theo dõi:</span>
                      <span className="value">{modalUser.followerCount || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Form thêm/chỉnh sửa
                <form className="user-form" onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateUser(modalUser);
                }}>
                  <div className="form-group">
                    <label htmlFor="name">Họ tên</label>
                    <input 
                      type="text"
                      id="name"
                      value={modalUser.name}
                      onChange={(e) => setModalUser({...modalUser, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                      type="email"
                      id="email"
                      value={modalUser.email}
                      onChange={(e) => setModalUser({...modalUser, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  {modalType === 'add' && (
                    <div className="form-group">
                      <label htmlFor="password">Mật khẩu</label>
                      <input 
                        type="password"
                        id="password"
                        value={modalUser.password || ''}
                        onChange={(e) => setModalUser({...modalUser, password: e.target.value})}
                        required={modalType === 'add'}
                        minLength={6}
                      />
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label htmlFor="role">Vai trò</label>
                    <select 
                      id="role"
                      value={modalUser.role}
                      onChange={(e) => setModalUser({...modalUser, role: e.target.value})}
                    >
                      <option value="user">Người dùng</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="is_verified">Trạng thái</label>
                    <select 
                      id="is_verified"
                      value={modalUser.is_verified ? "1" : "0"}
                      onChange={(e) => setModalUser({...modalUser, is_verified: e.target.value === "1"})}
                    >
                      <option value="1">Đã xác minh</option>
                      <option value="0">Chưa xác minh</option>
                    </select>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                      Hủy
                    </button>
                    <button type="submit" className="btn-save">
                      {modalType === 'add' ? 'Thêm mới' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;