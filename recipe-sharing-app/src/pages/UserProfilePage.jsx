import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ReportButton from '../components/report/ReportButton';
import './DashboardPage.css'; // Sử dụng CSS của Dashboard

const UserProfilePage = () => {
    const { currentUser } = useAuth();
    // Sửa đoạn này - sử dụng tham số URL đúng
    const { userId } = useParams(); // Thay vì const { id: userId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [stats, setStats] = useState({
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        likes: 0
    });
    const [recipes, setRecipes] = useState([]);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loadingFollowers, setLoadingFollowers] = useState(false);

    // Kiểm tra nếu đang xem trang cá nhân của chính mình
    useEffect(() => {
        if (currentUser && userId) {
            const currentUserId = parseInt(currentUser.id, 10);
            const profileId = parseInt(userId, 10);
            
            console.log("So sánh ID:", {currentUserId, profileId, equal: currentUserId === profileId});
            
            if (!isNaN(currentUserId) && !isNaN(profileId) && currentUserId === profileId) {
                console.log("Chuyển hướng đến dashboard vì đang xem chính mình");
                navigate('/dashboard', { replace: true });
                return;
            }
        }
        
        fetchProfileData();
    }, [currentUser, userId, navigate]);

    // Tải dữ liệu người dùng
    const fetchProfileData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Thêm xử lý đặc biệt cho trường hợp không có userId (từ file cũ)
            if (!userId && currentUser) {
                console.log("Using currentUser data:", currentUser);
                setProfileData(currentUser);
                setStats({
                    followerCount: currentUser.followerCount || 0,
                    followingCount: currentUser.followingCount || 0,
                    postCount: currentUser.recipeCount || 0,
                    likes: currentUser.likeCount || 0
                });
                setLoading(false);
                return;
            }
            
            if (!userId) {
                setError('ID người dùng không hợp lệ');
                setLoading(false);
                return;
            }
            
            const token = localStorage.getItem('auth_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            console.log("Đang tải thông tin người dùng ID:", userId);
            const response = await fetch(`http://localhost:5000/api/users/${userId}`, { headers });
            
            if (!response.ok) {
                throw new Error('Không thể tải thông tin người dùng');
            }
            
            const data = await response.json();
            console.log("Dữ liệu người dùng:", data);
            
            setProfileData(data.data);
            setStats({
                followerCount: data.data.followerCount || 0,
                followingCount: data.data.followingCount || 0,
                postCount: data.data.recipeCount || 0,
                likes: data.data.likeCount || 0
            });
            
            // Tải công thức của người dùng
            fetchUserRecipes();
            
            // Kiểm tra trạng thái theo dõi
            if (currentUser) {
                fetchFollowStatus();
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setError('Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    };

    // Tải công thức của người dùng
    const fetchUserRecipes = async () => {
        if (!userId) return;
        
        try {
            const token = localStorage.getItem('auth_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await fetch(`http://localhost:5000/api/users/${userId}/recipes`, { headers });
            
            if (response.ok) {
                const data = await response.json();
                setRecipes(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching user recipes:", error);
        }
    };

    // Kiểm tra trạng thái theo dõi - Sửa lỗi data = await response.json()
    const fetchFollowStatus = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`http://localhost:5000/api/users/${userId}/follow-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                // Sửa lỗi ở đây - sử dụng res thay vì response
                const data = await res.json();
                setIsFollowing(data.following);
            }
        } catch (error) {
            console.error("Error checking follow status:", error);
        }
    };

    // Xử lý theo dõi/hủy theo dõi
    const handleFollowToggle = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        
        try {
            const token = localStorage.getItem('auth_token');
            const endpoint = isFollowing ? 'unfollow' : 'follow';
            
            const res = await fetch(`http://localhost:5000/api/users/${userId}/${endpoint}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                setIsFollowing(!isFollowing);
                setStats(prev => ({
                    ...prev,
                    followerCount: isFollowing ? prev.followerCount - 1 : prev.followerCount + 1
                }));
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        }
    };

    // Xử lý hiển thị người theo dõi
    const handleShowFollowers = async () => {
        setShowFollowers(true);
        setLoadingFollowers(true);
        
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:5000/api/users/${userId}/followers`, {
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

    // Xử lý hiển thị đang theo dõi
    const handleShowFollowing = async () => {
        setShowFollowing(true);
        
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:5000/api/users/${userId}/following`, {
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

    // Lấy URL hình ảnh công thức
    const getRecipeImageUrl = (imagePath) => {
        if (!imagePath) return "/default-recipe.jpg";
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:5000${imagePath}`;
    };

    // Hiển thị UI loading
    if (loading) {
        return <div className="loading-spinner"><div className="spinner"></div></div>;
    }
    
    // Hiển thị lỗi với UI đẹp hơn
    if (error) {
        return (
            <div className="dashboard-container">
                <div className="error-container">
                    <h2>Có lỗi xảy ra</h2>
                    <p className="error-message">{error}</p>
                    <button className="btn-primary" onClick={() => navigate('/')}>
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    // Kiểm tra dữ liệu profile
    if (!profileData) {
        return (
            <div className="dashboard-container">
                <div className="error-container">
                    <h2>Không tìm thấy người dùng</h2>
                    <p className="error-message">Không thể tìm thấy thông tin người dùng yêu cầu</p>
                    <button className="btn-primary" onClick={() => navigate('/')}>
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    // Xử lý URL avatar
    const avatarUrl = profileData.picture 
        ? (profileData.picture.startsWith('http') 
            ? profileData.picture 
            : `http://localhost:5000${profileData.picture}`)
        : '/default-avatar.jpg';

    return (
        <div className="dashboard-container">
            {/* Hero Section với thông tin người dùng - Giống dashboard */}
            <div className="dashboard-hero">
                <div className="profile-container">
                    {/* Avatar section */}
                    <div className="profile-avatar-wrapper">
                        <div className="profile-avatar-container">
                            <img 
                                src={avatarUrl} 
                                alt={profileData.name} 
                                className="profile-avatar"
                                onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = "/default-avatar.jpg";
                                }}
                            />
                        </div>
                    </div>
                    
                    {/* Profile info */}
                    <div className="profile-info">
                        <h1>{profileData.name}</h1>
                        <p>{profileData.email}</p>
                        
                        {/* Nút theo dõi - chỉ hiển thị khi xem profile người khác */}
                        {currentUser && currentUser.id !== parseInt(userId) && (
                            <button 
                                className={`follow-button ${isFollowing ? 'following' : ''}`}
                                onClick={handleFollowToggle}
                            >
                                {isFollowing ? (
                                    <>
                                        <i className="fas fa-user-check"></i> Đang theo dõi
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-user-plus"></i> Theo dõi
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Stats container - Giống dashboard */}
                <div className="stats-container">
                    <div 
                        className="stat-item"
                        onClick={handleShowFollowers}
                    >
                        <h3>{stats.followerCount}</h3>
                        <p>Người theo dõi</p>
                        <i className="fas fa-users"></i>
                    </div>
                    <div 
                        className="stat-item"
                        onClick={handleShowFollowing}
                    >
                        <h3>{stats.followingCount}</h3>
                        <p>Đang theo dõi</p>
                        <i className="fas fa-user-friends"></i>
                    </div>
                    <div className="stat-item">
                        <h3>{stats.postCount}</h3>
                        <p>Bài đăng</p>
                        <i className="fas fa-book-open"></i>
                    </div>
                    <div className="stat-item">
                        <h3>{stats.likes}</h3>
                        <p>Lượt thích</p>
                        <i className="fas fa-heart"></i>
                    </div>
                </div>
            </div>
            
            {/* Tabs Navigation - Chỉ hiển thị tab Bài đăng đã đăng */}
            <div className="dashboard-tabs">
                <button className="tab-button active">
                    <i className="fas fa-book-open"></i>
                    <span>Bài đăng</span>
                </button>
            </div>
            
            {/* Recipe Content - Hiển thị các công thức */}
            <div className="dashboard-content">
                <div className="published-recipes">
                    {recipes.length > 0 ? (
                        <div className="recipes-grid">
                            {recipes.map(recipe => (
                                <div 
                                    key={recipe.id} 
                                    className="recipe-card" 
                                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                                >
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
                                            <span className="date">{new Date(recipe.created_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-book"></i>
                            <h3>Chưa có công thức nào</h3>
                            <p>Người dùng này chưa đăng công thức nào.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Nút báo cáo người dùng */}
            {currentUser && currentUser.id !== parseInt(userId) && (
                <div className="profile-action-buttons">
                    <ReportButton 
                        type="user"
                        targetId={profileData.id}
                        targetName={profileData.name}
                    />
                </div>
            )}
            
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
                                    <p>Chưa có người theo dõi</p>
                                </div>
                            ) : (
                                <ul className="followers-list">
                                    {followers.map(follower => (
                                        <li key={follower.id} className="follower-item">
                                            <div className="follower-profile">
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
                                                className="view-profile-btn"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
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

            {/* Modal đang theo dõi */}
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
                                    <p>Chưa theo dõi ai</p>
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
                                            <button 
                                                className="view-profile-btn"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setShowFollowing(false);
                                                    navigate(`/profile/${follow.id}`);
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
        </div>
    );
};

export default UserProfilePage;