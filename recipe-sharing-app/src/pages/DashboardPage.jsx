import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import RecipeCard from '../components/recipe/RecipeCard';
import { API_BASE_URL, ENDPOINTS } from '../config/api';
// Thêm import cho Followers và Following
import Followers from '../components/profile/Followers';
import Following from '../components/profile/Following';

const FollowersModal = ({ open, onClose, followers, loading }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Người theo dõi</h3>
        <button className="close-btn" onClick={onClose}>×</button>
        <ul className="user-list">
          {loading ? (
            <li>Đang tải...</li>
          ) : followers.length === 0 ? (
            <li>Chưa có người theo dõi nào</li>
          ) : (
            followers.map(user => (
              <li key={user.id}>
                <img src={user.picture || '/default-avatar.jpg'} alt={user.name} />
                <span>{user.name}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

const FollowingModal = ({ open, onClose, following }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Đang theo dõi</h3>
        <button className="close-btn" onClick={onClose}>×</button>
        <ul className="user-list">
          {following.length === 0 ? (
            <li>Bạn chưa theo dõi ai</li>
          ) : (
            following.map(user => (
              <li key={user.id}>
                <img src={user.picture || '/default-avatar.jpg'} alt={user.name} />
                <span>{user.name}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { currentUser, isAuthenticated, setCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [publishedRecipes, setPublishedRecipes] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [trashedRecipes, setTrashedRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('published');
  const [showEditName, setShowEditName] = useState(false);
  const [newName, setNewName] = useState('');
  const [uploading, setUploading] = useState(false);

  // Thống kê
  const [stats, setStats] = useState({
    followerCount: 0,
    followingCount: 0,
    publishedCount: 0,
    totalLikes: 0,
    totalShares: 0,
    totalSaves: 0,
  });

  const fileInputRef = useRef();

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Lấy thống kê cá nhân
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser?.id) return;
      try {
        const token = localStorage.getItem('auth_token');
        // SỬA endpoint này:
        const res = await fetch(`${API_BASE_URL}/users/${currentUser.id}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.data || {});
        }
      } catch (err) {
        // ignore
      }
    };
    fetchStats();
  }, [currentUser]);

  // Fetch các danh sách bài đăng
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      if (activeTab === 'published') {
        fetchUserRecipes();
      } else if (activeTab === 'draft') {
        fetchDrafts();
      } else if (activeTab === 'saved') {
        fetchSavedRecipes();
      } else if (activeTab === 'trash') {
        fetchTrashedRecipes();
      }
    }
    // eslint-disable-next-line
  }, [isAuthenticated, currentUser, activeTab]);

  // Lấy danh sách bài đăng đã đăng
  const fetchUserRecipes = async () => {
    try {
      setLoadingRecipes(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      // SỬA endpoint này:
      const endpoint = `/users/${currentUser.id}/recipes?status=published`;
      const response = await fetch(`http://localhost:5000/api${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Không thể tải bài đăng');
      const data = await response.json();
      setPublishedRecipes(data.data || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Lấy danh sách bản nháp
  const fetchDrafts = async () => {
    try {
      setLoadingRecipes(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      const endpoint = ENDPOINTS.recipes.drafts;
      const response = await fetch(API_BASE_URL + endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Không thể tải bản nháp');
      const data = await response.json();
      setDrafts(data.data || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Lấy danh sách bài đã lưu
  const fetchSavedRecipes = async () => {
    try {
      setLoadingSaved(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/recipes/saved`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Không thể tải bài đã lưu');
      const data = await response.json();
      setSavedRecipes(data.data || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Lấy danh sách bài đã xóa (thùng rác)
  const fetchTrashedRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('http://localhost:5000/api/recipes/trash', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTrashedRecipes(data.data || []);
    } catch (e) {
      setError('Không thể tải thùng rác');
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Đổi tên
  const handleEditName = async () => {
    console.log("handleEditName() đang được gọi");
    if (!newName.trim() || newName === currentUser.name) {
      console.log("Tên trống hoặc giống tên cũ, đóng ô nhập");
      setShowEditName(false);
      return;
    }
    
    try {
      console.log("Đang gọi API đổi tên");
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });
      
      // Xử lý kết quả API
      const data = await res.json();
      
      if (res.ok) {
        console.log("API trả về ok, cập nhật UI");
        
        // Thay vì sử dụng setCurrentUser
        // setCurrentUser(prev => ({ ...prev, name: newName }));
        
        // Cập nhật localStorage trước
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        userObj.name = newName;
        localStorage.setItem('user', JSON.stringify(userObj));
        
        // Khởi động lại để áp dụng thay đổi
        alert('Cập nhật tên thành công!');
        window.location.reload();
        
        // Đảm bảo các dòng này được thực thi trước khi reload
        setShowEditName(false);
        setNewName('');
      } else {
        console.log("API không trả về ok:", data.message);
        alert(data.message || "Không thể đổi tên");
      }
    } catch (err) {
      console.error("Lỗi khi đổi tên:", err);
      alert("Đã xảy ra lỗi khi đổi tên");
    }
  };

  // Đổi avatar
  const handleChangeAvatar = () => {
    fileInputRef.current.click();
  };
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`${API_BASE_URL}/users/upload-avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();

        // Cập nhật localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.picture = data.data.picture;
        localStorage.setItem('user', JSON.stringify(userData));

        window.location.reload();
      } else {
        // Xử lý lỗi
        const errorData = await res.json();
        throw new Error(errorData.message || 'Không thể cập nhật avatar');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật avatar:', err);
      alert(`Lỗi khi cập nhật avatar: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  // Thêm state loadingFollowers
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  const handleShowFollowers = async () => {
    setShowFollowers(true);
    setLoadingFollowers(true); // Bắt đầu loading
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`http://localhost:5000/api/users/${currentUser.id}/followers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFollowers(data.data || []);
    } catch (e) {
      setFollowers([]);
    } finally {
      setLoadingFollowers(false); // Kết thúc loading
    }
  };

  const handleShowFollowing = async () => {
    setShowFollowing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`http://localhost:5000/api/users/${currentUser.id}/following`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFollowing(data.data || []);
    } catch (e) {
      setFollowing([]);
    }
  };

  const handleRestoreRecipe = async (id) => {
    if (!window.confirm('Khôi phục bài đăng này?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`http://localhost:5000/api/recipes/${id}/restore`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Đã khôi phục bài đăng!');
        fetchTrashedRecipes();
        fetchUserRecipes && fetchUserRecipes();
      } else {
        alert(data.message || 'Lỗi khi khôi phục');
      }
    } catch (e) {
      alert('Lỗi khi khôi phục');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Xóa vĩnh viễn bài đăng này? Hành động này không thể hoàn tác!')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`http://localhost:5000/api/recipes/${id}/permanent`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Đã xóa vĩnh viễn bài đăng!');
        fetchTrashedRecipes();
      } else {
        alert(data.message || 'Lỗi khi xóa vĩnh viễn');
      }
    } catch (e) {
      alert('Lỗi khi xóa vĩnh viễn');
    }
  };

  const closeFollowersModal = () => {
    setShowFollowers(false);
  };

  const closeFollowingModal = () => {
    setShowFollowing(false);
  };

  if (!currentUser) return <div>Đang tải...</div>;

  // Avatar URL
  const avatarUrl = currentUser.picture
    ? currentUser.picture.startsWith('http')
      ? currentUser.picture
      : `http://localhost:5000${currentUser.picture}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=random`;

  // Nếu tài khoản bị khóa, chỉ chủ sở hữu mới xem được bài đăng
  const isSuspended = currentUser.is_suspended;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar" style={{ position: 'relative' }}>
          <img src={avatarUrl} alt="avatar" />
          <button className="avatar-edit-btn" onClick={handleChangeAvatar} title="Đổi avatar">
            <i className="fas fa-camera"></i>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleAvatarFileChange}
          />
          {uploading && <div className="uploading-overlay">Đang cập nhật...</div>}
        </div>
        <div className="profile-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showEditName ? (
              <>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEditName()}
                  autoFocus
                  style={{ fontSize: 22, fontWeight: 600 }}
                />
                <button 
                  onClick={(e) => {
                    e.preventDefault(); // Ngăn các sự kiện mặc định
                    e.stopPropagation(); // Ngăn sự kiện lan truyền
                    handleEditName();
                  }}
                >
                  <i className="fas fa-check"></i>
                </button>
                <button onClick={() => setShowEditName(false)}><i className="fas fa-times"></i></button>
              </>
            ) : (
              <>
                <h2 style={{ margin: 0 }}>{currentUser.name}</h2>
                <button className="edit-name-btn" onClick={() => { setShowEditName(true); setNewName(currentUser.name); }} title="Đổi tên">
                  <i className="fas fa-edit"></i>
                </button>
              </>
            )}
          </div>
          <p>{currentUser.email}</p>
          <p>ID: {currentUser.id}</p>
        </div>
      </div>

      {/* Thống kê */}
      <div className="profile-stats">
        <div className="stat-item" onClick={handleShowFollowers} style={{ cursor: 'pointer' }}>
          <span className="stat-label">Người theo dõi</span>
          <span className="stat-value">{stats.followerCount}</span>
        </div>
        <div className="stat-item" onClick={handleShowFollowing} style={{ cursor: 'pointer' }}>
          <span className="stat-label">Đang theo dõi</span>
          <span className="stat-value">{stats.followingCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Bài đăng</span>
          <span className="stat-value">{stats.publishedCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Lượt thích</span>
          <span className="stat-value">{stats.totalLikes}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={activeTab === 'published' ? 'active' : ''} onClick={() => setActiveTab('published')}>Bài đăng đã đăng</button>
        <button className={activeTab === 'draft' ? 'active' : ''} onClick={() => setActiveTab('draft')}>Bản nháp</button>
        <button className={activeTab === 'saved' ? 'active' : ''} onClick={() => setActiveTab('saved')}>Đã lưu</button>
        <button
          className={`tab-button ${activeTab === 'trash' ? 'active' : ''}`}
          onClick={() => setActiveTab('trash')}
        >
          <i className="fas fa-trash"></i> Thùng rác
        </button>
      </div>

      {/* Nội dung từng tab */}
      {activeTab === 'published' && (
        <div>
          <h3>Bài đăng đã đăng</h3>
          {isSuspended && (
            <div className="warning-message">
              Tài khoản của bạn đang bị khóa. Bài đăng chỉ mình bạn có thể xem.
            </div>
          )}
          {loadingRecipes ? (
            <div className="loading-spinner">Đang tải...</div>
          ) : publishedRecipes.length > 0 ? (
            <div className="recipe-grid">
              {publishedRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="no-recipes">
              <p>Bạn chưa có bài đăng nào</p>
              <button onClick={() => navigate('/create-recipe')}>Tạo công thức mới</button>
            </div>
          )}
        </div>
      )}
      {activeTab === 'draft' && (
        <div>
          <h3>Bản nháp</h3>
          {loadingRecipes ? (
            <div className="loading-spinner">Đang tải...</div>
          ) : drafts.length > 0 ? (
            <div className="recipe-grid">
              {drafts.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => navigate(`/edit-recipe/${recipe.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="no-recipes">
              <p>Bạn chưa có bản nháp nào</p>
              <button onClick={() => navigate('/create-recipe')}>Tạo công thức mới</button>
            </div>
          )}
        </div>
      )}
      {activeTab === 'saved' && (
        <div>
          <h3>Công thức đã lưu</h3>
          {loadingSaved ? (
            <div className="loading-spinner">Đang tải...</div>
          ) : savedRecipes.length > 0 ? (
            <div className="recipe-grid">
              {savedRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="no-recipes">
              <p>Bạn chưa lưu công thức nào</p>
              <button onClick={() => navigate('/')}>Khám phá công thức</button>
            </div>
          )}
        </div>
      )}
      {activeTab === 'trash' && (
        <div>
          <h3>Thùng rác</h3>
          {trashedRecipes.length === 0 ? (
            <div>Không có bài nào trong thùng rác</div>
          ) : (
            <div className="trashed-recipes-list">
              {trashedRecipes.map(recipe => (
                <div key={recipe.id} className="trashed-recipe-item">
                  <span>{recipe.title}</span>
                  <span>Đã xóa: {new Date(recipe.deleted_at).toLocaleDateString('vi-VN')}</span>
                  <button onClick={() => handleRestoreRecipe(recipe.id)}>Khôi phục</button>
                  <button style={{color: 'red'}} onClick={() => handlePermanentDelete(recipe.id)}>Xóa vĩnh viễn</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showFollowers && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={closeFollowersModal}>
              <i className="fas fa-times"></i>
            </button>
            <Followers 
              followers={followers} 
              followerCount={stats.followerCount} 
              loading={loadingFollowers}         // Thêm dòng này
              onClose={closeFollowersModal}
            />
          </div>
        </div>
      )}
      {showFollowing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={closeFollowingModal}>
              <i className="fas fa-times"></i>
            </button>
            <Following 
              userId={currentUser.id} 
              onClose={closeFollowingModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;