import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import './SearchResultsPage.css';
import RecipeCard from '../components/recipe/RecipeCard';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State để lưu trữ kết quả tìm kiếm
  const [recipeResults, setRecipeResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' hoặc 'users'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State cho bộ lọc
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    ingredient: searchParams.get('ingredient') || '',
    time: searchParams.get('time') || '',
    difficulty: searchParams.get('difficulty') || ''
  });
  
  // Lấy query từ URL
  const query = searchParams.get('q') || '';
  
  // Tải kết quả tìm kiếm khi params thay đổi
  useEffect(() => {
    // Lấy tab từ URL params nếu có
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'recipes' || tabParam === 'users')) {
      setActiveTab(tabParam);
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Lấy tất cả params từ URL
        const searchOptions = {
          query,
          category: searchParams.get('category'),
          ingredient: searchParams.get('ingredient'),
          time: searchParams.get('time'),
          difficulty: searchParams.get('difficulty')
        };
        
        // Tìm kiếm công thức
        if (activeTab === 'recipes') {
          const params = new URLSearchParams();
          if (query) params.append('query', query);
          if (searchOptions.category) params.append('category', searchOptions.category);
          if (searchOptions.ingredient) params.append('ingredient', searchOptions.ingredient);
          if (searchOptions.time) params.append('time', searchOptions.time);
          if (searchOptions.difficulty) params.append('difficulty', searchOptions.difficulty);
          
          const response = await fetch(`http://localhost:5000/api/search/recipes?${params.toString()}`);
          
          if (!response.ok) {
            throw new Error('Không thể tìm kiếm công thức');
          }
          
          const recipesResult = await response.json();
          setRecipeResults(recipesResult.data || []);
        }
        
        // Tìm kiếm người dùng
        if (activeTab === 'users') {
          const userResponse = await fetch(`http://localhost:5000/api/search/users?query=${encodeURIComponent(query)}`);
          
          if (!userResponse.ok) {
            throw new Error('Không thể tìm kiếm người dùng');
          }
          
          const usersResult = await userResponse.json();
          setUserResults(usersResult.data || []);
        }
      } catch (err) {
        console.error('Search error details:', err);
        setError('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    if (query) {
      fetchSearchResults();
    }
  }, [activeTab, query, searchParams]);
  
  // Xử lý thay đổi filters
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    
    // Cập nhật URL params
    searchParams.set(filterName, value);
    if (!value) searchParams.delete(filterName);
    setSearchParams(searchParams);
  };
  
  // Xử lý thay đổi tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="search-results-container">
      {/* Cập nhật phần hiển thị tiêu đề kết quả tìm kiếm */}
      <h1 className="search-results-title">
        Kết quả tìm kiếm: <span className="search-keyword">{query}</span>
      </h1>
      
      <div className="search-tabs">
        <button 
          className={`search-tab ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => handleTabChange('recipes')}
        >
          Công thức
        </button>
        <button 
          className={`search-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => handleTabChange('users')}
        >
          Người dùng
        </button>
      </div>
      
      {/* Hiển thị lỗi nếu có */}
      {error && <div className="error-message">{error}</div>}
      
      {/* Hiển thị phần loading */}
      {loading && <div className="loading-spinner">Đang tìm kiếm...</div>}
      
      {/* Kết quả tìm kiếm công thức */}
      {activeTab === 'recipes' && !loading && (
        <>
          <div className="search-filters">
            <div className="filter-group">
              <label className="filter-label">Danh mục:</label>
              <select 
                className="filter-select"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="breakfast">Bữa sáng</option>
                <option value="lunch">Bữa trưa</option>
                <option value="dinner">Bữa tối</option>
                <option value="dessert">Tráng miệng</option>
                <option value="snack">Ăn vặt</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Nguyên liệu chính:</label>
              <input
                className="filter-input"
                type="text"
                placeholder="Ví dụ: trứng"
                value={filters.ingredient}
                onChange={(e) => handleFilterChange('ingredient', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Thời gian:</label>
              <select 
                className="filter-select"
                value={filters.time}
                onChange={(e) => handleFilterChange('time', e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="quick">Nhanh (&lt; 30 phút)</option>
                <option value="medium">Trung bình (30-60 phút)</option>
                <option value="long">Lâu (&gt; 60 phút)</option>
              </select>
            </div>
          </div>
          
          {/* Kết quả */}
          {recipeResults.length > 0 ? (
            <div className="recipe-results-grid">
              {recipeResults.map(recipe => (
                <div key={recipe.id} className="recipe-card" onClick={() => navigate(`/recipe/${recipe.id}`)}>
                  <img 
                    className="recipe-image" 
                    src={recipe.image_url ? `http://localhost:5000${recipe.image_url}` : '/default-recipe.jpg'} 
                    alt={recipe.title} 
                    onError={(e) => { e.target.src = '/default-recipe.jpg' }}
                  />
                  <div className="recipe-info">
                    <h3 className="recipe-title">{recipe.title}</h3>
                    <p className="recipe-description">{recipe.description || 'Không có mô tả'}</p>
                    <div className="recipe-meta">
                      <span className="recipe-author">
                        <i className="fas fa-user"></i> {recipe.author_name}
                      </span>
                      <span className="recipe-time">
                        <i className="fas fa-clock"></i> {recipe.cooking_time} phút
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Phần hiển thị khi không tìm thấy kết quả
            <div className="no-results">
              <div className="no-results-icon">
                <i className="fas fa-search"></i>
              </div>
              <h3 className="no-results-heading">Không tìm thấy công thức nào phù hợp với từ khóa này.</h3>
              <p className="no-results-text">Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc.</p>
              
              <div className="no-results-suggestions">
                <h4>Gợi ý tìm kiếm phổ biến:</h4>
                <div className="suggestion-chips">
                  <span className="suggestion-chip" onClick={() => handleSuggestionClick('gà')}>Gà</span>
                  <span className="suggestion-chip" onClick={() => handleSuggestionClick('hải sản')}>Hải sản</span>
                  <span className="suggestion-chip" onClick={() => handleSuggestionClick('bánh')}>Bánh</span>
                  <span className="suggestion-chip" onClick={() => handleSuggestionClick('lẩu')}>Lẩu</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Kết quả tìm kiếm người dùng */}
      {activeTab === 'users' && !loading && (
        <div className="users-results">
          {userResults.length > 0 ? (
            <div className="users-grid">
              {userResults.map(user => (
                <Link to={`/profile/${user.id}`} key={user.id}>
                  <div className="user-card">
                    <img 
                      src={user.picture || '/default-avatar.jpg'} 
                      alt={user.name}
                      className="user-avatar"
                      onError={(e) => {e.target.src = '/default-avatar.jpg'}}
                    />
                    <div className="user-info">
                      <h3>{user.name}</h3>
                      <p>{user.recipe_count} công thức</p>
                      {user.bio && <p className="user-bio">{user.bio}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>Không tìm thấy người dùng nào phù hợp với từ khóa này.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;