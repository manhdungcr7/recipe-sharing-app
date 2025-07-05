import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/imageUtils';
import './Header.css';

const Header = () => {
    const { currentUser, logout, isAuthenticated } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    
    const navigate = useNavigate();
    const location = useLocation();
    const searchInputRef = useRef(null);
    const suggestionRef = useRef(null);

    // Kiểm tra xem có đang ở trang Dashboard hoặc Notifications không
    const isDashboard = location.pathname === '/dashboard';
    const isNotifications = location.pathname === '/notifications';

    // Lấy số thông báo chưa đọc
    useEffect(() => {
        if (isAuthenticated) {
            // Giả lập API gọi thông báo
            setUnreadNotificationsCount(2); // Giá trị mẫu
        }
    }, [isAuthenticated]);

    // Thay thế hàm fetchSearchSuggestions hiện tại bằng hàm này
    const fetchSearchSuggestions = async (query) => {
        if (!query || query.length < 2) return;
        
        setIsLoadingSuggestions(true);
        try {
            const response = await fetch(`http://localhost:5000/api/search/autocomplete?q=${encodeURIComponent(query)}`);            
            if (response.ok) {
                const data = await response.json();
                // API trả về results chứ không phải data
                setSearchSuggestions(data.results || []);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    // Xử lý click vào gợi ý
    const handleSuggestionClick = (suggestion) => {
        if (suggestion.type === 'recipe') {
            navigate(`/recipe/${suggestion.id}`);
        } else if (suggestion.type === 'user') {
            navigate(`/profile/${suggestion.id}`);
        } else {
            setSearchQuery(suggestion.name || suggestion.query);
            navigate(`/search?q=${encodeURIComponent(suggestion.name || suggestion.query)}`);
        }
        setShowSuggestions(false);
    };

    // Thêm useEffect để xử lý click bên ngoài dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (suggestionRef.current && !suggestionRef.current.contains(e.target) &&
                searchInputRef.current && !searchInputRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setShowSuggestions(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        logout();
        navigate('/login');
    };

    // Trong component Header, đảm bảo chỉ render một lần bằng cách thêm điều kiện
    // Thêm kiểm tra vào đoạn đầu của hàm render 
    // (Thêm dòng này ngay sau khai báo các biến của component)

    // Kiểm tra xem đã có header nào khác trên trang chưa
    const existingHeader = document.querySelectorAll('.header-container').length > 0;
    const isNestedLayout = document.querySelectorAll('.main-layout').length > 1;

    // Nếu đây là header lồng ghép trong layout khác, không render
    if (isNestedLayout && existingHeader) {
      return null;
    }

    // Tiếp tục render header bình thường ở phần còn lại
    return (
        <header className={`main-header ${isDashboard ? 'dashboard-header' : ''}`}>
            <div className="header-container">
                <div className="header-left">
                    <div className="header-logo">
                        <img src="/logo.png" alt="Recipe Sharing Logo" />
                        <h1>Recipe Sharing</h1>
                    </div>
                </div>

                <div className="search-container">
                    <form onSubmit={handleSearch}>
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Tìm kiếm công thức..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    // Chỉ gọi API gợi ý khi có ít nhất 2 ký tự
                                    if (e.target.value.length >= 2) {
                                        fetchSearchSuggestions(e.target.value);
                                    } else {
                                        setSearchSuggestions([]);
                                        setShowSuggestions(false);
                                    }
                                }}
                                ref={searchInputRef}
                            />
                            <button type="submit" className="search-button" aria-label="Tìm kiếm">
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </form>

                    {/* Gợi ý tìm kiếm */}
                    {showSuggestions && searchSuggestions && searchSuggestions.length > 0 && (
                        <div 
                            className="search-suggestions" 
                            ref={suggestionRef}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                width: '100%',
                                backgroundColor: 'white',
                                borderRadius: '0 0 8px 8px',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                zIndex: 100,
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}
                        >
                            <ul className="suggestion-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {searchSuggestions.map((suggestion, index) => (
                                    <li 
                                        key={`${suggestion.type}-${suggestion.id || index}`}
                                        className="suggestion-item"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        style={{
                                            padding: '10px 16px',
                                            borderBottom: '1px solid #f0f0f0',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        {suggestion.type === 'recipe' ? (
                                            <>
                                                <i className="fas fa-utensils" style={{ marginRight: '10px' }}></i>
                                                <span>{suggestion.name}</span>
                                            </>
                                        ) : suggestion.type === 'user' ? (
                                            <>
                                                <i className="fas fa-user" style={{ marginRight: '10px' }}></i>
                                                <span>{suggestion.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-search" style={{ marginRight: '10px' }}></i>
                                                <span>{suggestion.name || suggestion.query}</span>
                                            </>
                                        )}
                                    </li>
                                ))}
                                <li 
                                    className="suggestion-item suggestion-search-all"
                                    onClick={handleSearch}
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: '#f9f9f9',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderTop: '1px solid #e0e0e0'
                                    }}
                                >
                                    <i className="fas fa-search" style={{ marginRight: '10px' }}></i>
                                    <span>Tìm kiếm "{searchQuery}"</span>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <div className="header-actions">
                    {isAuthenticated ? (
                        <>
                            <Link to="/create-recipe" className="create-recipe-btn">
                                <i className="fas fa-plus"></i> Tạo công thức
                            </Link>
                            
                            
                            
                            <Link to="/notifications" className="notification-icon">
                                <i className="fas fa-bell"></i>
                                {unreadNotificationsCount > 0 && (
                                    <span className="notification-counter">{unreadNotificationsCount}</span>
                                )}
                            </Link>
                            
                            <Link to="/dashboard" className="user-profile-link">
                                <img 
                                    src={getAvatarUrl(currentUser?.picture)} 
                                    alt={currentUser?.name || "User"}
                                    className="user-avatar"
                                    onError={(e) => {e.target.src = "/default-avatar.jpg"}}
                                />
                                <span className="user-name">{currentUser?.name}</span>
                            </Link>
                            
                            <button onClick={handleLogout} className="logout-btn">
                                <i className="fas fa-sign-out-alt"></i> Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="action-btn login-btn">
                                <i className="fas fa-sign-in-alt"></i> Đăng nhập
                            </Link>
                            
                            <Link to="/register" className="action-btn register-btn">
                                <i className="fas fa-user-plus"></i> Đăng ký
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;