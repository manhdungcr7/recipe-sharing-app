import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import RecipeCard from '../components/recipe/RecipeCard';
import { generateAvatarUrl } from '../utils/imageUtils';
import './HomePage.css';

const HomePage = () => {
    const { currentUser, isAuthenticated, updateAvatar } = useContext(AuthContext);
    const navigate = useNavigate();
    const [userRecipes, setUserRecipes] = useState([]);
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [draftRecipes, setDraftRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(() => {
      const savedTab = localStorage.getItem('activeProfileTab');
      return savedTab || 'my-recipes';
    });
    const [userData, setUserData] = useState(null);

    const [showAvatarOptions, setShowAvatarOptions] = useState(false);
    const [showViewAvatar, setShowViewAvatar] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    
    // ĐỊNH NGHĨA CÁC HÀM FETCH DỮ LIỆU - CHỈ KHAI BÁO MỘT LẦN
    
    // Hàm lấy công thức của người dùng
    const fetchUserRecipes = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            console.log(`Fetching recipes for user ${userId} with token: ${token ? "Present" : "Missing"}`);
            
            // Fetch user recipes
            const recipesResponse = await fetch(`http://localhost:5000/api/user/${userId}/recipes?status=published`, { headers });
            
            if (recipesResponse.ok) {
                const recipesData = await recipesResponse.json();
                setUserRecipes(recipesData.data || []);
                console.log("User public recipes loaded:", recipesData.data?.length || 0);
            } else {
                const errorText = await recipesResponse.text();
                console.error("Failed to load recipes:", errorText);
                throw new Error("Không thể tải công thức của bạn");
            }
            
            // Fetch bản nháp riêng biệt
            const draftsResponse = await fetch(`http://localhost:5000/api/recipes/drafts`, { headers });
            
            if (draftsResponse.ok) {
                const draftsData = await draftsResponse.json();
                setDraftRecipes(draftsData.data || []);
                console.log("User draft recipes loaded:", draftsData.data?.length || 0);
            } else {
                console.error("Failed to load drafts");
            }
            
            // Fetch công thức đã lưu
            const savedResponse = await fetch(`http://localhost:5000/api/recipes/saved`, { headers });
            
            if (savedResponse.ok) {
                const savedData = await savedResponse.json();
                setSavedRecipes(savedData.data || []);
                console.log("Saved recipes loaded:", savedData.data?.length || 0);
            } else {
                const errorText = await savedResponse.text();
                console.error("Failed to load saved recipes:", errorText);
            }
            
        } catch (error) {
            console.error("Error fetching recipes:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Hàm lấy bản nháp
    const fetchDrafts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const response = await fetch('http://localhost:5000/api/recipes/drafts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setDraftRecipes(data.data || []);
            } else {
                console.error("Failed to load drafts:", await response.text());
            }
        } catch (error) {
            console.error("Error fetching drafts:", error);
        } finally {
            setLoading(false);
        }
    };
    
    // XÓA TẤT CẢ CÁC ĐỊNH NGHĨA SAU CỦA fetchUserRecipes VÀ fetchDrafts

    // Function để xử lý khi click vào avatar
    const handleAvatarClick = () => {
        setShowAvatarOptions(true);
    };
    
    // Function để xem avatar kích thước lớn
    const handleViewAvatar = () => {
        setShowAvatarOptions(false);
        setShowViewAvatar(true);
    };
    
    // Function để đóng modal xem avatar
    const handleCloseViewAvatar = () => {
        setShowViewAvatar(false);
    };
    
    // Function để mở file picker khi chọn thay avatar
    const handleChangeAvatar = () => {
        setShowAvatarOptions(false);
        fileInputRef.current.click();
    };
    
    // Function xử lý khi file được chọn
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Kiểm tra nếu file không phải là hình ảnh
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file hình ảnh.');
            return;
        }
        
        // Giới hạn kích thước file (ví dụ: 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
            return;
        }
        
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('avatar', file);
            
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://localhost:5000/api/users/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Cập nhật avatar trong context và localStorage
                if (updateAvatar) {
                    updateAvatar(result.data.picture);
                }
                
                // Cập nhật thông tin user trong localStorage
                const userData = JSON.parse(localStorage.getItem('user'));
                userData.picture = result.data.picture;
                localStorage.setItem('user', JSON.stringify(userData));
                
                alert('Cập nhật avatar thành công!');
                window.location.reload(); // Reload để hiển thị avatar mới
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Không thể cập nhật avatar');
            }
        } catch (err) {
            console.error('Error updating avatar:', err);
            alert(`Lỗi khi cập nhật avatar: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };
    
    useEffect(() => {
        // Click bên ngoài để đóng menu
        const handleClickOutside = (event) => {
            if (showAvatarOptions && !event.target.closest('.profile-avatar-container')) {
                setShowAvatarOptions(false);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showAvatarOptions]);
    
    // CHỈNH SỬA useEffect - CHỈ GIỮ LẠI MỘT PHIÊN BẢN
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                if (!currentUser || !currentUser.id) {
                  console.error("Missing user data:", currentUser);
                  setError("Không thể tải dữ liệu. Vui lòng thử đăng nhập lại.");
                  setLoading(false);
                  return;
                }
                
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                
                console.log("Fetching data for user:", currentUser.id, headers);
                
                try {
                  // Thêm timeout cho fetch
                  const fetchWithTimeout = async (url, options, timeout = 15000) => {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), timeout);
                    
                    try {
                      const response = await fetch(url, {
                        ...options,
                        signal: controller.signal
                      });
                      clearTimeout(id);
                      return response;
                    } catch (error) {
                      clearTimeout(id);
                      if (error.name === 'AbortError') {
                        throw new Error('Request timeout');
                      }
                      throw error;
                    }
                  };
                  
                  // Gọi API với timeout
                  const response = await fetchWithTimeout(
                    `http://localhost:5000/api/user/${currentUser.id}/recipes?status=published`,
                    { headers },
                    5000
                  );
                  
                  if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API error (${response.status}): ${errorText}`);
                  }
                  
                  const data = await response.json();
                  setUserRecipes(data.data || []);
                  
                  // Các fetch khác...
                  
                } catch (fetchError) {
                  console.error("API request failed:", fetchError);
                  setError(`Không thể tải dữ liệu: ${fetchError.message}`);
                }
                
            } catch (error) {
                console.error("Error fetching recipes:", error);
                setError(`Lỗi: ${error.message || 'Không xác định'}`);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated && currentUser?.id) {
            fetchUserData();
        }
    }, [isAuthenticated, currentUser]);

    // XÓA useEffect trùng lặp thứ hai

    if (loading) {
        return <div className="loading-spinner">Đang tải...</div>;
    }
    
    // Lấy URL avatar
    const avatarUrl = currentUser?.picture
        ? `http://localhost:5000${currentUser.picture}`
        : generateAvatarUrl(currentUser?.name || 'User');
    
    // Màu nền cho avatar placeholder
    const avatarColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    
    // Cập nhật phần hiển thị thông tin người dùng trên dashboard
    const renderUserProfile = () => {
        if (!currentUser) {
            return <div>Không có thông tin người dùng</div>;
        }
        
        // Lấy URL avatar từ currentUser
        const avatarUrl = currentUser.picture
            ? currentUser.picture.startsWith('http') 
              ? currentUser.picture 
              : `http://localhost:5000${currentUser.picture}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=random`;
        
        return (
            <div className="user-profile">
                <div className="profile-avatar">
                    <img src={avatarUrl} alt={currentUser.name || "Người dùng"} />
                </div>
                <div className="profile-info">
                    <h2>{currentUser.name || "Người dùng"}</h2>
                    <p>{currentUser.email}</p>
                    <p>ID: {currentUser.id}</p>
                </div>
            </div>
        );
    };
    
    return (
        <div className="home-page">
            <div className="profile-section">
                <div className="profile-header">
                    {/* Avatar container với tính năng click */}
                    <div className="profile-avatar-container" onClick={handleAvatarClick}>
                        {currentUser?.picture ? (
                            <img
                                src={currentUser.picture.startsWith('http') 
                                    ? currentUser.picture 
                                    : `http://localhost:5000${currentUser.picture}`}
                                alt={currentUser?.name || "User"}
                                className="profile-avatar"
                                onError={(e) => {e.target.src = generateAvatarUrl(currentUser?.name || 'User')}}
                            />
                        ) : (
                            <div 
                                className="profile-avatar-placeholder"
                                style={{
                                    backgroundColor: avatarColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '42px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {currentUser?.name?.charAt(0) || "U"}
                            </div>
                        )}
                        
                        {/* Overlay khi hover */}
                        <div className="avatar-overlay">
                            <i className="fas fa-camera"></i>
                        </div>
                        
                        {/* Menu options khi click */}
                        {showAvatarOptions && (
                            <div className="avatar-options">
                                <button onClick={handleViewAvatar}>
                                    <i className="fas fa-eye"></i> Xem avatar
                                </button>
                                <button onClick={handleChangeAvatar}>
                                    <i className="fas fa-camera"></i> Thay avatar
                                </button>
                            </div>
                        )}
                        
                        {/* Hidden file input */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                    
                    <div className="profile-info">
                        <h1>{currentUser?.name || "Người dùng"}</h1>
                        <p>{currentUser?.email || "email@example.com"}</p>
                        {/* Thêm ID để debug */}
                        <p className="user-id-display">ID: {currentUser?.id || "Không có ID"}</p>
                    </div>
                </div>
                
                {/* Avatar modal */}
                {showViewAvatar && (
                    <div className="avatar-modal-overlay" onClick={handleCloseViewAvatar}>
                        <div className="avatar-modal">
                            <div className="avatar-modal-content" onClick={(e) => e.stopPropagation()}>
                                <img src={avatarUrl} alt={currentUser?.name || 'User'} />
                            </div>
                            <button className="avatar-modal-close" onClick={handleCloseViewAvatar}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Overlay hiển thị trong quá trình upload */}
                {uploading && (
                    <div className="upload-overlay">
                        <div className="upload-spinner"></div>
                        <p>Đang cập nhật avatar...</p>
                    </div>
                )}
                
                <div className="profile-stats">
                    <div className="stat-item">
                        <span className="stat-label">Người theo dõi:</span>
                        <span className="stat-value">{currentUser?.followerCount || 0}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Đang theo dõi:</span>
                        <span className="stat-value">{currentUser?.followingCount || 0}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Công thức:</span>
                        <span className="stat-value">{userRecipes.length || 0}</span>
                    </div>
                </div>
                
                {/* Tabs điều hướng */}
                <div className="profile-tabs">
                  <button 
                    className={`tab-button ${activeTab === 'my-recipes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my-recipes')}
                  >
                    <i className="fas fa-utensils"></i> Công thức của tôi
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'saved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('saved')}
                  >
                    <i className="fas fa-bookmark"></i> Đã lưu
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'drafts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('drafts')}
                  >
                    <i className="fas fa-file-alt"></i> Bản nháp
                    {draftRecipes.length > 0 && (
                      <span className="badge">{draftRecipes.length}</span>
                    )}
                  </button>
                </div>
                
                {/* Hiển thị công thức dựa trên tab đang chọn */}
                <div className="recipes-section">
                    {activeTab === 'my-recipes' && (
                        <>
                            <h2>Công thức của tôi</h2>
                            {error && <p className="error-message">{error}</p>}
                            
                            {userRecipes.length === 0 ? (
                                <p className="empty-message">Bạn chưa có công thức nào đã đăng. Hãy tạo công thức đầu tiên!</p>
                            ) : (
                                <div className="recipes-grid">
                                    {userRecipes.map(recipe => (
                                        <Link to={`/recipe/${recipe.id}`} key={recipe.id}>
                                            <RecipeCard recipe={recipe} />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    {activeTab === 'saved' && (
                        <>
                            <h2>Công thức đã lưu</h2>
                            
                            {error && <p className="error-message">{error}</p>}
                            
                            {savedRecipes.length === 0 ? (
                                <p className="empty-message">Bạn chưa lưu công thức nào.</p>
                            ) : (
                                <div className="recipes-grid">
                                    {savedRecipes.map(recipe => (
                                        <Link to={`/recipe/${recipe.id}`} key={recipe.id}>
                                            <RecipeCard recipe={recipe} />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    {/* Hiển thị bản nháp */}
                    {activeTab === 'drafts' && (
                      <div className="drafts-container">
                        <h2>Bản nháp của tôi</h2>
                        
                        {loading ? (
                          <div className="loading-spinner centered"><div className="spinner"></div></div>
                        ) : draftRecipes.length === 0 ? (
                          <div className="empty-state">
                            <i className="fas fa-file-alt empty-icon"></i>
                            <p>Bạn chưa có bản nháp nào</p>
                            <button 
                              className="primary-button"
                              onClick={() => navigate('/create-recipe')}
                            >
                              <i className="fas fa-plus"></i> Tạo công thức mới
                            </button>
                          </div>
                        ) : (
                          <div className="drafts-grid">
                            {draftRecipes.map(draft => (
                              <div className="draft-card" key={draft.id}>
                                <div className="draft-image" onClick={() => navigate(`/edit-recipe/${draft.id}`)}>
                                  {draft.image_url ? (
                                    <img 
                                      src={draft.image_url.startsWith('http') 
                                        ? draft.image_url
                                        : `http://localhost:5000${draft.image_url}`}
                                      alt={draft.title || "Bản nháp"}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'C:\Users\Lenovo\Documents\web_SE\recipe-sharing-app\public\default-recipe.jpg';
                                      }}
                                    />
                                  ) : (
                                    <div className="draft-placeholder">
                                      <i className="fas fa-file-alt"></i>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="draft-info">
                                  <h3 onClick={() => navigate(`/edit-recipe/${draft.id}`)}>
                                    {draft.title || "Bản nháp chưa đặt tên"}
                                  </h3>
                                  <p className="draft-date">
                                    <i className="fas fa-clock"></i> Cập nhật lúc: {new Date(draft.updated_at).toLocaleString('vi-VN')}
                                  </p>
                                </div>
                                
                                <div className="draft-actions">
                                  <button 
                                    className="action-button edit"
                                    onClick={() => navigate(`/edit-recipe/${draft.id}`)}
                                    title="Chỉnh sửa"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  
                                  <button 
                                    className="action-button publish"
                                    onClick={async () => {
                                      if (window.confirm('Bạn có chắc muốn đăng công thức này?')) {
                                        try {
                                          const token = localStorage.getItem('token');
                                          const response = await fetch(`http://localhost:5000/api/recipes/draft/${draft.id}/publish`, {
                                            method: 'POST',
                                            headers: {
                                              'Authorization': `Bearer ${token}`
                                            }
                                          });
                                          
                                          if (!response.ok) {
                                            const errorData = await response.json();
                                            throw new Error(errorData.message || 'Không thể đăng công thức');
                                          }
                                          
                                          const data = await response.json();
                                          alert('Đã đăng công thức thành công!');
                                          
                                          // Cập nhật lại danh sách
                                          fetchDrafts();
                                          fetchUserRecipes(userData.id);
                                          
                                          // Chuyển sang tab công thức
                                          setActiveTab('my-recipes');
                                        } catch (error) {
                                          alert(error.message || 'Đã có lỗi xảy ra khi đăng công thức');
                                        }
                                      }
                                    }}
                                    title="Đăng công thức"
                                  >
                                    <i className="fas fa-paper-plane"></i>
                                  </button>
                                  
                                  <button 
                                    className="action-button delete"
                                    onClick={async () => {
                                      if (window.confirm('Bạn có chắc muốn xóa bản nháp này không?')) {
                                        try {
                                          const token = localStorage.getItem('token');
                                          const response = await fetch(`http://localhost:5000/api/recipes/draft/${draft.id}`, {
                                            method: 'DELETE',
                                            headers: {
                                              'Authorization': `Bearer ${token}`
                                            }
                                          });
                                          
                                          if (!response.ok) {
                                            throw new Error('Không thể xóa bản nháp');
                                          }
                                          
                                          alert('Đã xóa bản nháp thành công!');
                                          
                                          // Cập nhật lại danh sách
                                          fetchDrafts();
                                        } catch (error) {
                                          alert('Đã có lỗi xảy ra khi xóa bản nháp');
                                        }
                                      }
                                    }}
                                    title="Xóa bản nháp"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;