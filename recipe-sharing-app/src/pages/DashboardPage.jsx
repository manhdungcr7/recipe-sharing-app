import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import RecipeCard from '../components/recipe/RecipeCard';
import './DashboardPage.css';
import { getAvatarUrl } from '../utils/imageUtils';
import AvatarOptionsPortal from '../components/common/AvatarOptionsPortal';

// Constants
const API_BASE_URL = 'http://localhost:5000/api';

const DashboardPage = () => {
  const { currentUser, isAuthenticated, setCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [publishedRecipes, setPublishedRecipes] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [trashedRecipes, setTrashedRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState('published');
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [stats, setStats] = useState({
    followerCount: 0,
    followingCount: 0,
    publishedCount: 0,
    totalLikes: 0
  });
  const [showEditName, setShowEditName] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [showViewAvatar, setShowViewAvatar] = useState(false);
  const [avatarMenuPosition, setAvatarMenuPosition] = useState({ top: 0, left: 0 });

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Thêm hàm fetchUserStats
  const fetchUserStats = async () => {
    try {
      if (!currentUser?.id) return;
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          followerCount: data.data.followerCount || 0,
          followingCount: data.data.followingCount || 0,
          publishedCount: data.data.publishedCount || 0,
          totalLikes: data.data.totalLikes || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Thêm hàm fetchPublishedRecipes
  const fetchPublishedRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/recipes?status=published`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPublishedRecipes(data.data || []);
      } else {
        console.error('Error fetching published recipes:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching published recipes:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Thêm hàm fetchDrafts
  const fetchDrafts = async () => {
    setLoadingRecipes(true);
    try {
      const token = localStorage.getItem('auth_token');
      // Nếu /recipes/drafts không có, sử dụng /users/{id}/recipes?status=draft
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/recipes?status=draft`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.data || []);
      } else {
        console.error('Error fetching drafts:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Thêm hàm fetchSavedRecipes
  const fetchSavedRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const token = localStorage.getItem('auth_token');
      // Đã sử dụng đúng endpoint /api/recipes/saved/
      const response = await fetch(`${API_BASE_URL}/recipes/saved/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedRecipes(data.data || []);
      } else {
        console.error('Error fetching saved recipes:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Kiểm tra xem API trash có tồn tại không, nếu không thì không hiển thị tab này
  const fetchTrashedRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const token = localStorage.getItem('auth_token');
      // Sử dụng users/:id/recipes với status=trash (kiểm tra xem API này có tồn tại không)
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/recipes?status=trash`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrashedRecipes(data.data || []);
      } else {
        console.error('Error fetching trashed recipes:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching trashed recipes:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  // useEffect để fetch dữ liệu khi component mount hoặc khi tab thay đổi
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      fetchUserStats();
      
      // Gọi API tương ứng với tab đang active
      if (activeTab === 'published') {
        fetchPublishedRecipes();
      } else if (activeTab === 'draft') {
        fetchDrafts();
      } else if (activeTab === 'saved') {
        fetchSavedRecipes();
      } else if (activeTab === 'trash') {
        fetchTrashedRecipes();
      }
    }
  }, [isAuthenticated, currentUser, activeTab]);

  // Thêm useEffect để thiết lập class cho body
  useEffect(() => {
    // Thêm class vào body cho hình nền
    document.body.classList.add('dashboard-page-active');
    
    // Cleanup khi unmount
    return () => {
      document.body.classList.remove('dashboard-page-active');
    };
  }, []);

  // Xử lý đổi tên người dùng
  const handleEditName = async () => {
    if (!newName.trim() || newName === currentUser.name) {
      setShowEditName(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName })
      });
      
      if (response.ok) {
        // Cập nhật localStorage với tên mới
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.name = newName;
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Cập nhật context
        setCurrentUser(prev => ({...prev, name: newName}));
        
        console.log("Tên người dùng đã được cập nhật trong localStorage:", newName);
        alert('Đã cập nhật tên thành công!');
        setShowEditName(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật tên');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật tên:', err);
      alert(`Có lỗi xảy ra: ${err.message}`);
    }
  };

  // Tạo URL cho avatar
  const avatarUrl = currentUser?.picture 
    ? (currentUser.picture.startsWith('http') 
      ? currentUser.picture 
      : `http://localhost:5000${currentUser.picture}`)
    : '/default-avatar.jpg';

  // Xử lý khi nhấp vào "Xem avatar"
  const handleViewAvatar = (e) => {
    e.stopPropagation(); // Quan trọng: ngăn sự kiện lan truyền
    console.log("Xem avatar được click");
    setShowAvatarOptions(false);
    setShowViewAvatar(true);
  };

  // Đóng modal xem avatar
  const handleCloseViewAvatar = () => {
    setShowViewAvatar(false);
  };

  // Xử lý khi nhấp vào "Thay avatar"
  const handleChangeAvatar = (e) => {
    e.stopPropagation(); // Quan trọng: ngăn sự kiện lan truyền
    console.log("Thay avatar được click");
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Click vào input file ẩn
    }
    setShowAvatarOptions(false); // Đóng menu dropdown
  };

  // Xử lý khi file được chọn
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset input để có thể chọn cùng file nhiều lần
    e.target.value = null;
    
    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh.');
      return;
    }
    
    // Tiến hành upload avatar
    console.log("Đang tải avatar lên...");
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/users/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cập nhật avatar trong context và localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.picture = data.data.picture; // Lưu ý: structure có thể khác tùy API
        localStorage.setItem('user', JSON.stringify(userData));
        
        setCurrentUser(prev => ({...prev, picture: data.data.picture}));
        alert('Đã cập nhật avatar thành công!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật avatar');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật avatar:', err);
      alert(`Có lỗi xảy ra: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Xử lý hiển thị followers
  const handleShowFollowers = async () => {
    console.log("Opening followers modal");
    setShowFollowers(true);
    setLoadingFollowers(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      // Đảm bảo API_BASE_URL đúng hoặc sử dụng URL tuyệt đối
      const response = await fetch(`${API_BASE_URL || 'http://localhost:5000/api'}/users/${currentUser.id}/followers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowers(data.data || []);
      } else {
        console.error('Error fetching followers:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  // Xử lý hiển thị following
  const handleShowFollowing = async () => {
    setShowFollowing(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/following`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.data || []);
      } else {
        console.error('Error fetching following:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  // Thêm hàm này trước return statement
  const getRecipeImageUrl = (imageUrl) => {
    if (!imageUrl) return "/default-recipe.jpg";
    return imageUrl.startsWith('http') 
      ? imageUrl 
      : `http://localhost:5000${imageUrl}`;
  };

  // Thêm vào file JSX (DashboardPage.jsx hoặc HomePage.jsx) trong phần hooks
  useEffect(() => {
    // Hàm xử lý click bên ngoài menu
    const handleClickOutside = (event) => {
      // Kiểm tra xem click có nằm trong avatar container hay không
      const avatarContainer = document.querySelector('.profile-avatar-wrapper');
      const avatarElement = document.querySelector('.profile-avatar-container');
      
      if (showAvatarOptions && 
          avatarContainer && 
          !avatarContainer.contains(event.target) &&
          avatarElement && 
          !avatarElement.contains(event.target)) {
        setShowAvatarOptions(false);
      }
    };
    
    // Đăng ký sự kiện click
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup function khi component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAvatarOptions]); // Dependency - chỉ chạy lại khi showAvatarOptions thay đổi

  // Cập nhật hàm xử lý click vào avatar
  const handleAvatarClick = (e) => {
    e.stopPropagation(); // Quan trọng: ngăn sự kiện lan truyền 
    setShowAvatarOptions(!showAvatarOptions);
  };

  // Thêm hàm formatDate vào bên trong component DashboardPage
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!currentUser) {
    return <div className="loading-spinner">Đang tải...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Hero Section với thông tin người dùng */}
      <div className="dashboard-hero">
        <div className="profile-container">
          {/* Avatar section */}
          {/* Profile avatar container */}
          <div className="profile-avatar-wrapper">
            <div 
              className="profile-avatar-container"
              onClick={handleAvatarClick}
            >
              <img 
                src={avatarUrl} 
                alt={currentUser?.name} 
                className="profile-avatar"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "/default-avatar.jpg";
                }}
              />
              <div className="avatar-overlay">
                <i className="fas fa-camera"></i>
              </div>
            </div>
            
            {/* Menu avatar - KHÔNG dùng Portal */}
            {showAvatarOptions && (
              <div className="avatar-options">
                <button type="button" onClick={handleViewAvatar}>
                  <i className="fas fa-eye"></i> Xem avatar
                </button>
                <button type="button" onClick={handleChangeAvatar}>
                  <i className="fas fa-camera"></i> Thay avatar
                </button>
              </div>
            )}
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleAvatarFileChange}
              accept="image/*"
            />
          </div>
          
          {/* Profile info */}
          <div className="profile-info">
            {showEditName ? (
              <form className="edit-name-form" onSubmit={(e) => {
                e.preventDefault();
                handleEditName();
              }}>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nhập tên mới"
                  autoFocus
                />
                <button type="submit">Lưu</button>
                <button type="button" onClick={() => setShowEditName(false)}>Hủy</button>
              </form>
            ) : (
              <h1 onClick={() => {
                setShowEditName(true);
                setNewName(currentUser?.name || '');
              }}>
                {currentUser?.name || "Người dùng"} 
                <i className="fas fa-pencil-alt" style={{ marginLeft: "10px", fontSize: "16px", cursor: "pointer" }}></i>
              </h1>
            )}
            <p>{currentUser?.email || "email@example.com"}</p>
          </div>
        </div>
        
        {/* Stats container */}
        <div className="stats-container">
          <div 
            className="stat-item" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShowFollowers();
            }}
          >
            <h3>{stats.followerCount}</h3>
            <p>Người theo dõi</p>
            <i className="fas fa-users"></i>
          </div>
          <div 
            className="stat-item" 
            onClick={(e) => {
              e.preventDefault(); 
              e.stopPropagation();
              handleShowFollowing();
            }}
          >
            <h3>{stats.followingCount}</h3>
            <p>Đang theo dõi</p>
            <i className="fas fa-user-friends"></i>
          </div>
          <div className="stat-item">
            <h3>{stats.publishedCount}</h3>
            <p>Bài đăng</p>
            <i className="fas fa-book-open"></i>
          </div>
          <div className="stat-item">
            <h3>{stats.totalLikes}</h3>
            <p>Lượt thích</p>
            <i className="fas fa-heart"></i>
          </div>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          <i className="fas fa-book-open"></i>
          <span>Bài đăng</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'draft' ? 'active' : ''}`}
          onClick={() => setActiveTab('draft')}
        >
          <i className="fas fa-edit"></i>
          <span>Bản nháp</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <i className="fas fa-bookmark"></i>
          <span>Đã lưu</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'trash' ? 'active' : ''}`}
          onClick={() => setActiveTab('trash')}
        >
          <i className="fas fa-trash"></i>
          <span>Thùng rác</span>
        </button>
      </div>
      
      {/* Content based on active tab */}
      <div className="tab-content">
        {/* Phần published recipes */}
        {activeTab === 'published' && (
          <div className="published-recipes">
            {loadingRecipes ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : publishedRecipes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-utensils"></i></div>
                <h4>Bạn chưa có công thức nào</h4>
                <p>Hãy tạo công thức đầu tiên để chia sẻ với cộng đồng.</p>
                <Link to="/create-recipe" className="btn">Tạo công thức</Link>
              </div>
            ) : (
              <div className="recipes-grid">
                {publishedRecipes.map(recipe => (
                  <div key={recipe.id} className="recipe-card" onClick={() => navigate(`/recipe/${recipe.id}`)}>
                    <div className="recipe-image-container">
                      <img 
                        src={getRecipeImageUrl(recipe.image_url)} 
                        alt={recipe.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default-recipe.jpg";
                        }}
                      />
                    </div>
                    <div className="recipe-info">
                      <h3>{recipe.title}</h3>
                      <p>{recipe.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Phần draft recipes - đã được chỉnh sửa */}
        {activeTab === 'draft' && (
          <div className="draft-recipes">
            {loadingRecipes ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : drafts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-edit"></i></div>
                <h4>Bạn chưa có bản nháp nào</h4>
                <p>Tạo công thức mới và lưu dưới dạng bản nháp để chỉnh sửa sau.</p>
                <Link to="/create-recipe" className="btn">Tạo công thức</Link>
              </div>
            ) : (
              <div className="recipes-grid">
                {drafts.map(recipe => (
                  <div key={recipe.id} className="recipe-card" onClick={() => navigate(`/edit-recipe/${recipe.id}`)}>
                    <div className="recipe-image-container">
                      <img 
                        src={getRecipeImageUrl(recipe.image_url)} 
                        alt={recipe.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default-recipe.jpg";
                        }}
                      />
                    </div>
                    <div className="recipe-info">
                      <h3>{recipe.title}</h3>
                      <p>{recipe.description || "Chưa có mô tả"}</p>
                      <div className="recipe-meta">
                        <span className="status draft">Bản nháp</span>
                        <span className="date">{new Date(recipe.updated_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Phần saved recipes - đã được chỉnh sửa */}
        {activeTab === 'saved' && (
          <div className="saved-recipes">
            {loadingRecipes ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : savedRecipes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-bookmark"></i></div>
                <h4>Bạn chưa lưu công thức nào</h4>
                <p>Khám phá các công thức và lưu lại những món bạn yêu thích.</p>
                <Link to="/" className="btn">Khám phá công thức</Link>
              </div>
            ) : (
              <div className="recipes-grid">
                {savedRecipes.map(recipe => (
                  <div key={recipe.id} className="recipe-card" onClick={() => navigate(`/recipe/${recipe.id}`)}>
                    <div className="recipe-image-container">
                      <img 
                        src={getRecipeImageUrl(recipe.image_url)} 
                        alt={recipe.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default-recipe.jpg";
                        }}
                      />
                    </div>
                    <div className="recipe-info">
                      <h3>{recipe.title}</h3>
                      <p>{recipe.description || "Chưa có mô tả"}</p>
                      <div className="recipe-author">
                        <span>Công thức của: {recipe.author_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Tương tự cho các tab khác - trash */}
        {activeTab === 'trash' && (
          <div className="trash-container">
            <div className="trash-header">
              <h2>Công thức đã xóa</h2>
              <p className="trash-info">
                Công thức sẽ được lưu trong thùng rác 30 ngày trước khi bị xóa vĩnh viễn
              </p>
            </div>
            
            {trashedRecipes.length === 0 ? (
              <div className="empty-trash">
                <div className="empty-trash-icon">
                  <i className="fas fa-trash"></i>
                </div>
                <p>Thùng rác trống</p>
                <span>Các công thức bạn đã xóa sẽ xuất hiện ở đây</span>
              </div>
            ) : (
              <div className="trash-recipes-grid">
                {trashedRecipes.map(recipe => (
                  <div key={recipe.id} className="trash-recipe-card">
                    <div className="trash-recipe-image">
                      {recipe.image_url ? (
                        <img 
                          src={`http://localhost:5000${recipe.image_url}`} 
                          alt={recipe.title} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/default-recipe.jpg";
                          }}
                        />
                      ) : (
                        <img src="/default-recipe.jpg" alt="Default Recipe" />
                      )}
                      <div className="deletion-overlay">
                        <i className="fas fa-trash-alt"></i>
                        <span>Đã xóa {new Date(recipe.deleted_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    
                    <div className="trash-recipe-content">
                      <h3 className="trash-recipe-title">{recipe.title}</h3>
                      <div className="trash-recipe-meta">
                        <span className="trash-delete-date">
                          <i className="far fa-calendar-alt"></i> Đã xóa: {new Date(recipe.deleted_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="trash-recipe-actions">
                        <button 
                          className="restore-button"
                          onClick={() => handleRestoreRecipe(recipe.id)}
                        >
                          <i className="fas fa-trash-restore"></i> Khôi phục
                        </button>
                        <button 
                          className="delete-forever-button"
                          onClick={() => {
                            if(window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn công thức này? Hành động này không thể hoàn tác.")) {
                              handlePermanentDelete(recipe.id);
                            }
                          }}
                        >
                          <i className="fas fa-times-circle"></i> Xóa vĩnh viễn
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal người theo dõi */}
      {showFollowers && (
        <div className="modal-overlay" onClick={() => setShowFollowers(false)}>
          <div className="modal-content follower-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Người theo dõi</h3>
              <button className="close-modal" onClick={() => setShowFollowers(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {loadingFollowers ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
              ) : followers.length === 0 ? (
                <div className="empty-followers">
                  <p>Bạn chưa có người theo dõi nào</p>
                </div>
              ) : (
                <ul className="followers-list">
                  {followers.map(follower => (
                    <li key={follower.id} className="follower-item">
                      <div className="follower-info-wrapper">
                        <img 
                          src={follower.picture 
                            ? (follower.picture.startsWith('http') 
                              ? follower.picture 
                              : `http://localhost:5000${follower.picture}`)
                            : `/default-avatar.jpg`} 
                          alt={follower.name} 
                          className="follower-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/default-avatar.jpg";
                          }}
                        />
                        <div className="follower-info">
                          <h4 className="follower-name">{follower.name}</h4>
                        </div>
                      </div>
                      <button 
                        className="follow-button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowFollowers(false);
                          navigate(`/profile/${follower.id}`);
                        }}
                      >
                        Xem trang cá nhân
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal đang theo dõi - tương tự */}
      {showFollowing && (
        <div className="modal-overlay" onClick={() => setShowFollowing(false)}>
          <div className="modal-content follower-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đang theo dõi</h3>
              <button className="close-modal" onClick={() => setShowFollowing(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              {following.length === 0 ? (
                <div className="empty-following">
                  <p>Bạn chưa theo dõi ai</p>
                </div>
              ) : (
                <ul className="followers-list">
                  {following.map(follow => (
                    <li key={follow.id} className="follower-item">
                      <div className="follower-profile">
                        <img 
                          src={follow.picture 
                            ? (follow.picture.startsWith('http') 
                              ? follow.picture 
                              : `http://localhost:5000${follow.picture}`)
                            : `/default-avatar.jpg`} 
                          alt={follow.name} 
                          className="follower-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/default-avatar.jpg";
                          }}
                        />
                        <div className="follower-info">
                          <h4 className="follower-name">{follow.name}</h4>
                        </div>
                      </div>
                      <div className="follower-actions">
                        <button 
                          className="view-profile-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowFollowing(false);
                            navigate(`/profile/${follow.id}`);
                          }}
                        >
                          Xem trang cá nhân
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal xem avatar */}
      {showViewAvatar && (
        <div className="modal-overlay" onClick={() => setShowViewAvatar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img 
              src={avatarUrl} 
              alt={currentUser?.name} 
              className="modal-avatar"
            />
            <button className="modal-close" onClick={() => setShowViewAvatar(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Overlay hiển thị trong quá trình upload */}
      {uploading && (
        <div className="upload-overlay">
          <div className="spinner"></div>
          <p>Đang tải lên...</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;