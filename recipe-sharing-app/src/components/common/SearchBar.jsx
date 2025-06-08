import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './SearchBar.css';

const SearchBar = ({ placeholder = "Tìm kiếm công thức..." }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [popularKeywords, setPopularKeywords] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const suggestionRef = useRef(null);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const { currentUser } = useContext(AuthContext); // Thêm dòng này
    
    // Fetch gợi ý tự động với Typesense
    const fetchSuggestions = async (query) => {
        if (!query || query.length < 2) return;
        
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:5000/api/search/autocomplete?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const results = data.results || [];
                    
                    // Hiển thị kết quả + thêm tùy chọn "tìm kiếm" cho mỗi loại
                    const enhancedResults = [
                        ...results,
                        { type: 'search', query: query, searchType: 'recipe' },
                        { type: 'search', query: query, searchType: 'user' }
                    ];
                    
                    setSuggestions(enhancedResults);
                    setShowSuggestions(true);
                }
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Fetch từ khóa phổ biến
    const fetchPopularKeywords = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/search/popular');
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
    
    // Debounce tìm kiếm
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
    
    // Xử lý click bên ngoài
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
    
    // Cập nhật phần xử lý click vào gợi ý
    const handleSuggestionClick = (suggestion) => {
        setShowSuggestions(false);
        
        if (suggestion.type === 'recipe') {
            navigate(`/recipe/${suggestion.id}`);
        } else if (suggestion.type === 'user') {
            // Kiểm tra nếu là trang cá nhân của chính mình
            if (currentUser && currentUser.id === parseInt(suggestion.id)) {
                navigate(`/dashboard`);
            } else {
                navigate(`/profile/${suggestion.id}`);
            }
        } else if (suggestion.type === 'search') {
            if (suggestion.searchType === 'recipe') {
                navigate(`/search?q=${encodeURIComponent(suggestion.query)}`);
            } else if (suggestion.searchType === 'user') {
                navigate(`/search?q=${encodeURIComponent(suggestion.query)}&tab=users`);
            }
        } else {
            setSearchQuery(suggestion);
            navigate(`/search?q=${encodeURIComponent(suggestion)}`);
        }
    };
    
    return (
        <div className="search-bar-container" ref={searchRef}>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                />
                <button type="submit">
                    <i className="fas fa-search"></i>
                </button>
            </form>
            
            {/* Dropdown gợi ý */}
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
                                                <div className="suggestion-image">
                                                    <img 
                                                        src={suggestion.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.title)}&background=random`} 
                                                        alt={suggestion.title}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.title)}&background=random`;
                                                        }}
                                                    />
                                                </div>
                                                <div className="suggestion-content">
                                                    <i className="fas fa-utensils"></i>
                                                    <span className="suggestion-text">{suggestion.title}</span>
                                                </div>
                                            </>
                                        ) : suggestion.type === 'user' ? (
                                            <>
                                                <i className="fas fa-user"></i>
                                                <span className="suggestion-text">{suggestion.name}</span>
                                            </>
                                        ) : suggestion.type === 'search' ? (
                                            <>
                                                <i className={suggestion.searchType === 'user' ? "fas fa-users" : "fas fa-search"}></i>
                                                <span className="suggestion-text">
                                                    {suggestion.searchType === 'user' ? 
                                                        `Tìm kiếm người dùng: "${suggestion.query}"` : 
                                                        `Tìm kiếm công thức: "${suggestion.query}"`}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-search"></i>
                                                <span className="suggestion-text">{suggestion.query}</span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
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
                    
                    {/* Loader */}
                    {isLoading && (
                        <div className="loading-suggestions">
                            <span>Đang tìm kiếm...</span>
                            <div className="spinner"></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;