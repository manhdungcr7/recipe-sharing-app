import React, { useState, useEffect } from 'react';
import './AdminUsersPage.css';
import { getAuthToken } from '../../utils/authHelper';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [modalType, setModalType] = useState('');

  // Thêm biến state để quản lý modal khóa tài khoản
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockDays, setLockDays] = useState(1);
  const [lockReason, setLockReason] = useState('');
  const [lockPermanent, setLockPermanent] = useState(false);
  const [userToLock, setUserToLock] = useState(null);

  // State cho modal thông báo người dùng
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [userToNotify, setUserToNotify] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info'); // info, warning, alert

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // Tạo URLSearchParams
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      params.append('sort', sortBy);
      
      // Xử lý searchTerm
      if (searchTerm) {
        // Kiểm tra xem searchTerm có phải là số (ID) không
        const isNumeric = /^\d+$/.test(searchTerm.trim());
        
        if (isNumeric) {
          // Nếu là số, tìm theo ID
          params.append('id', searchTerm.trim());
        } else {
          // Tìm theo tên hoặc email
          params.append('search', searchTerm);
        }
      }
      
      if (filterRole !== 'all') params.append('role', filterRole);
      
      // Gọi API với các bộ lọc
      const response = await fetch(`http://localhost:5000/api/admin/users?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
      }

      if (!response.ok) {
        throw new Error('Không thể lấy danh sách người dùng');
      }
      
      // Log response để debug
      const data = await response.json();
      console.log("API response:", data);
      
      setUsers(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
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
    // XÓA filterVerification khỏi dependency array
  }, [currentPage, filterRole, sortBy, searchTerm]);

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

  // Hàm xử lý xóa tài khoản
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác!')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể xóa người dùng');
      }
      
      // Cập nhật danh sách
      setUsers(users.filter(user => user.id !== userId));
      alert('Đã xóa người dùng thành công');
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

  // Hàm xử lý khóa tài khoản
  const showLockUserModal = (user) => {
    // Chỉ cho phép khóa tài khoản người dùng (không phải admin)
    if (user.role === 'admin') {
      alert('Không thể khóa tài khoản admin');
      return;
    }
    
    setUserToLock(user);
    setLockDays(1);
    setLockReason('');
    setLockPermanent(false);
    setShowLockModal(true);
  };

  // Thêm hàm xử lý khóa tài khoản
  const handleLockUser = async (e) => {
    e.preventDefault();
    
    if (!lockReason.trim()) {
      alert('Vui lòng nhập lý do khóa tài khoản');
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userToLock.id}/suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          days: lockPermanent ? -1 : lockDays, // -1 đại diện cho khóa vĩnh viễn
          reason: lockReason,
          isPermanent: lockPermanent
        })
      });
      
      if (!response.ok) {
        throw new Error('Không thể khóa tài khoản người dùng');
      }
      
      // Cập nhật UI
      setUsers(users.map(user => 
        user.id === userToLock.id 
          ? { 
              ...user, 
              is_blocked: true, 
              block_reason: lockReason,
              block_expiry: lockPermanent ? null : new Date(Date.now() + lockDays * 24 * 60 * 60 * 1000).toISOString() 
            } 
          : user
      ));
      
      setShowLockModal(false);
      alert('Đã khóa tài khoản thành công');
    } catch (err) {
      console.error('Error locking user:', err);
      setError(err.message);
    }
  };

  // Thêm hàm xử lý gỡ khóa tài khoản

  // Thêm hàm này sau handleLockUser
  const handleUnlockUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn gỡ khóa tài khoản này?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/unsuspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Không thể gỡ khóa tài khoản người dùng');
      }
      
      // Cập nhật UI
      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              is_blocked: false, 
              block_reason: null,
              block_expiry: null 
            } 
          : user
      ));
      
      alert('Đã gỡ khóa tài khoản thành công');
    } catch (err) {
      console.error('Error unlocking user:', err);
      setError(err.message);
    }
  };

  // Hàm hiển thị modal thông báo
  const showNotifyUserModal = (user) => {
    setUserToNotify(user);
    setNotificationMessage('');
    setNotificationType('info');
    setShowNotifyModal(true);
  };

  // Hàm xử lý gửi thông báo
  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!notificationMessage.trim()) {
      alert('Vui lòng nhập nội dung thông báo');
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userToNotify.id}/notify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: notificationMessage,
          type: notificationType
        })
      });
      
      if (!response.ok) {
        throw new Error('Không thể gửi thông báo');
      }
      
      // Thông báo thành công
      alert(`Đã gửi thông báo đến ${userToNotify.name} thành công!`);
      
      // Đóng modal
      setShowNotifyModal(false);
    } catch (err) {
      console.error('Error sending notification:', err);
      alert(err.message);
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
            <label>Sắp xếp:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name">Tên (A-Z)</option>
            </select>
          </div>
        </div>
        
        <form className="admin-search" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Tìm theo ID, tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // Thêm xử lý khi nhấn phím Enter
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e);
              }
            }}
            className="search-input"
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
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  checked={users.length > 0 && selectedUsers.length === users.length} 
                  onChange={handleSelectAll}
                />
              </th>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
              <th>Khóa TK</th> {/* Thêm cột này */}
              <th>Xóa TK</th>  {/* Thêm cột này */}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="loading-cell">
                  <div className="spinner small"></div> Đang tải...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-table">Không có người dùng nào phù hợp</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className={user.is_blocked ? 'blocked-user' : ''}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td>{user.id}</td>
                  <td>
                    <div className="user-name-cell">
                      <img 
                        src={user.picture ? `http://localhost:5000${user.picture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                        alt={user.name}
                        className="user-avatar-small"
                      />
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'admin' ? 'Admin' : 'Người dùng'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                  
                  {/* Cột thao tác (giữ nguyên) */}
                  <td>
                    <div className="action-buttons">
                      <button className="btn-view" onClick={() => showUserDetails(user)} title="Xem chi tiết">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="btn-edit" onClick={() => showEditUser(user)} title="Sửa">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="btn-role" onClick={() => handleToggleRole(user.id, user.role)} title={user.role === 'admin' ? 'Hủy quyền Admin' : 'Cấp quyền Admin'}>
                        {user.role === 'admin' ? 
                          <i className="fas fa-user"></i> : 
                          <i className="fas fa-user-shield"></i>
                        }
                      </button>
                      {/* Thêm nút gửi thông báo */}
                      <button className="btn-notify" onClick={() => showNotifyUserModal(user)} title="Gửi thông báo">
                        <i className="fas fa-bell"></i>
                      </button>
                    </div>
                  </td>
                  
                  {/* Cột khóa tài khoản (mới) */}
                  <td>
                    <button 
                      className={`btn-lock ${user.is_blocked ? 'active' : ''}`} 
                      onClick={() => user.is_blocked ? handleUnlockUser(user.id) : showLockUserModal(user)}
                      disabled={user.role === 'admin'}
                      title={user.role === 'admin' ? 'Không thể khóa tài khoản admin' : 
                             (user.is_blocked ? 'Gỡ khóa tài khoản' : 'Khóa tài khoản')}
                    >
                      <i className={`fas ${user.is_blocked ? 'fa-unlock' : 'fa-lock'}`}></i>
                      {user.is_blocked ? ' Gỡ khóa' : ' Khóa TK'}
                    </button>
                  </td>
                  
                  {/* Cột xóa tài khoản (mới) */}
                  <td>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDeleteUser(user.id)}
                      title="Xóa tài khoản"
                    >
                      <i className="fas fa-trash-alt"></i> Xóa TK
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

      {/* Modal khóa tài khoản */}
      {showLockModal && userToLock && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Khóa tài khoản: {userToLock.name}</h3>
              <button className="close-btn" onClick={() => setShowLockModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleLockUser}>
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="lockPermanent"
                    checked={lockPermanent}
                    onChange={(e) => setLockPermanent(e.target.checked)}
                  />
                  <label htmlFor="lockPermanent">Khóa vĩnh viễn</label>
                </div>
                
                {!lockPermanent && (
                  <div className="form-group">
                    <label htmlFor="lockDays">Số ngày khóa:</label>
                    <input
                      type="number"
                      id="lockDays"
                      min="1"
                      max="365"
                      value={lockDays}
                      onChange={(e) => setLockDays(parseInt(e.target.value))}
                      required
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="lockReason">Lý do khóa tài khoản:</label>
                  <textarea
                    id="lockReason"
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    required
                  ></textarea>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowLockModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn-save">
                    Khóa tài khoản
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal gửi thông báo */}
      {showNotifyModal && userToNotify && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Gửi thông báo đến người dùng: {userToNotify.name}</h3>
              <button className="close-btn" onClick={() => setShowNotifyModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSendNotification}>
                <div className="form-group">
                  <label>Loại thông báo:</label>
                  <select 
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value)}
                  >
                    <option value="info">Thông tin</option>
                    <option value="warning">Cảnh báo</option>
                    <option value="alert">Quan trọng</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Nội dung thông báo:</label>
                  <textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Nhập nội dung thông báo đến người dùng..."
                    rows="5"
                    required
                  ></textarea>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={() => setShowNotifyModal(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-send">
                    <i className="fas fa-paper-plane"></i> Gửi thông báo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
