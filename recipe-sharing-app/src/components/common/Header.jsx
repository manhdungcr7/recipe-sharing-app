import React, { useContext, useState, useCallback, memo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { generateAvatarUrl } from '../../utils/imageUtils';
import { debounce } from '../../utils/helpers';
import { useStableColor } from '../../utils/colorUtils'; // Import từ utils/colorUtils
import { API_BASE_URL, ENDPOINTS } from '../../config/api';
import './Header.css';

// Sử dụng memo để tránh re-render không cần thiết
const Header = memo(() => {
    const { currentUser, logout, isAuthenticated } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [popularKeywords, setPopularKeywords] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [avatarLoaded, setAvatarLoaded] = useState(false);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const navigate = useNavigate();
    const suggestionRef = useRef(null);
    const searchRef = useRef(null);
    
    // Hàm fetch gợi ý tự động
    const fetchSuggestions = async (query) => {
        if (!query || query.length < 2) {
            // Nếu không có query hoặc query quá ngắn, hiển thị từ khóa phổ biến
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/search/autocomplete?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSuggestions(data.results || []);
                    setShowSuggestions(true);
                }
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };
    
    // Fetch từ khóa phổ biến khi component được mount
    const fetchPopularKeywords = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/search/popular`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setPopularKeywords(data.popularKeywords || []);
                }
            }
        } catch (error) {
            console.error('Error fetching popular keywords:', error);
        }
    };
    
    // Load từ khóa phổ biến khi component mount
    useEffect(() => {
        fetchPopularKeywords();
    }, []);
    
    // Debounce tìm kiếm để tránh gọi API quá nhiều
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (searchQuery) {
                fetchSuggestions(searchQuery);
            } else {
                setSuggestions([]);
            }
        }, 300);
        
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);
    
    // Xử lý click bên ngoài để đóng gợi ý
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                suggestionRef.current && 
                !suggestionRef.current.contains(event.target) &&
                searchRef.current && 
                !searchRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Xử lý tìm kiếm
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowSuggestions(false);
        }
    };
    
    // Xử lý khi click vào gợi ý
    const handleSuggestionClick = (suggestion) => {
        setShowSuggestions(false);
        
        if (suggestion.type === 'recipe') {
            navigate(`/recipe/${suggestion.id}`);
        } else if (suggestion.type === 'user') {
            navigate(`/profile/${suggestion.id}`);
        } else {
            setSearchQuery(suggestion);
            navigate(`/search?q=${encodeURIComponent(suggestion)}`);
        }
    };
    
    // Xử lý sự kiện khi ảnh tải xong
    const handleImageLoad = () => {
        setAvatarLoaded(true);
    };

    const handleImageError = (e) => {
        e.target.src = generateAvatarUrl(userName);
        setAvatarLoaded(true);
    };

    const avatarColor = useStableColor(currentUser?.id);

    const userName = currentUser?.name || 'Người dùng';
    const userAvatar = currentUser?.picture 
                  ? `http://localhost:5000${currentUser.picture}` 
                  : generateAvatarUrl(userName);
    const userId = currentUser?.id;
    const logoLink = isAuthenticated ? "/dashboard" : "/";

    // Thêm hàm handleLogout ở đây
    const handleLogout = () => {
        logout(); // Gọi hàm logout từ AuthContext
        navigate('/login'); // Chuyển hướng về trang login
    };
    
    // Thêm useEffect để lấy số lượng thông báo chưa đọc
    useEffect(() => {
      const fetchUnreadCount = async () => {
        if (!isAuthenticated) return;
        
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          // Sử dụng API_BASE_URL và ENDPOINTS
          const response = await fetch(`${API_BASE_URL}${ENDPOINTS.notifications.unreadCount}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUnreadNotificationsCount(data.count || 0);
          }
        } catch (error) {
          console.error('Error fetching unread notifications:', error);
        }
      };
      
      fetchUnreadCount();
      
      // Thiết lập polling để cập nhật số lượng thông báo mỗi phút
      const intervalId = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(intervalId);
    }, [isAuthenticated, currentUser]);
    
    return (
        <header className="header">
            <div className="container">
                <Link to="/" className="logo">
                    <img src="/logo.png" alt="Recipe Sharing" className="logo-image" />
                </Link>
                
                <div className="header-spacer"></div>
                
                <div className="search-bar" ref={searchRef}>
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Tìm kiếm công thức..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onFocus={() => {
                                setIsSearchFocused(true);
                                setShowSuggestions(true);
                            }}
                        />
                        <button type="submit">
                            <i className="fas fa-search"></i>
                        </button>
                    </form>
                    
                    {/* Dropdown gợi ý tìm kiếm */}
                    {showSuggestions && (
                        <div className="search-suggestions" ref={suggestionRef}>
                            {searchQuery.length < 2 ? (
                                <>
                                    <div className="suggestion-header">
                                        <span className="suggestion-title">Tìm kiếm phổ biến</span>
                                    </div>
                                    <div className="suggestion-list">
                                        {popularKeywords.map((keyword, index) => (
                                            <div 
                                                key={`popular-${index}`}
                                                className="suggestion-item"
                                                onClick={() => handleSuggestionClick(keyword)}
                                            >
                                                <i className="fas fa-search"></i>
                                                <span className="suggestion-text">{keyword}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : suggestions.length > 0 ? (
                                <>
                                    <div className="suggestion-list">
                                        {suggestions.map((suggestion, index) => (
                                            <div 
                                                key={`${suggestion.type}-${suggestion.id || index}`} 
                                                className="suggestion-item"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                            >
                                                {suggestion.type === 'recipe' ? (
                                                    <>
                                                        <i className="fas fa-utensils"></i>
                                                        <span className="suggestion-text">{suggestion.title}</span>
                                                    </>
                                                ) : suggestion.type === 'user' ? (
                                                    <>
                                                        <i className="fas fa-user"></i>
                                                        <span className="suggestion-text">{suggestion.name}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-search"></i>
                                                        <span className="suggestion-text">{suggestion}</span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Hiển thị button tìm kiếm đầy đủ */}
                                    <div 
                                        className="suggestion-footer"
                                        onClick={handleSearch}
                                    >
                                        <i className="fas fa-search"></i>
                                        <span className="suggestion-text">Tìm kiếm "{searchQuery}"</span>
                                    </div>
                                </>
                            ) : (
                                <div className="no-suggestions">
                                    <p>Không tìm thấy kết quả phù hợp</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <nav className="header-nav">
                    {isAuthenticated ? (
                        <>
                            <Link to="/create-recipe">Tạo công thức</Link>
                            <div className="user-menu">
                                <Link to="/dashboard" className="menu-item">
                                    <i className="fas fa-home"></i> Trang chủ
                                </Link>
                                
                                <Link to="/create-recipe" className="menu-item">
                                    <i className="fas fa-plus"></i> Tạo công thức
                                </Link>
                                
                                {/* Thêm nút thông báo */}
                                <Link to="/notifications" className="menu-item notification-link">
                                    <i className="fas fa-bell"></i> Thông báo
                                    {unreadNotificationsCount > 0 && (
                                      <span className="notification-badge">{unreadNotificationsCount}</span>
                                    )}
                                </Link>
                                
                                <Link to="/saved-recipes" className="menu-item">
                                    <i className="fas fa-bookmark"></i> Đã lưu
                                </Link>
                                
                                {currentUser?.role === 'admin' && (
                                  <Link to="/admin" className="menu-item admin-link">
                                    <i className="fas fa-user-shield"></i> Quản trị
                                  </Link>
                                )}
                                
                                <div className="divider"></div>
                                
                                <button className="menu-item" onClick={handleLogout}>
                                    <i className="fas fa-sign-out-alt"></i> Đăng xuất
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-login">Đăng nhập</Link>
                            <Link to="/register" className="nav-register">Đăng ký</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
});

export default Header;