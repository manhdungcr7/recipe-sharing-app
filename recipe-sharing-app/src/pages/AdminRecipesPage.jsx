import React, { useState, useEffect } from 'react';
import './AdminRecipesPage.css';

const AdminRecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        
        // Lấy token từ localStorage
        const token = localStorage.getItem('auth_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // Call API để lấy danh sách công thức
        const response = await fetch('http://localhost:5000/api/admin/recipes', {
          headers
        });
        
        if (!response.ok) {
          throw new Error('Không thể lấy danh sách công thức');
        }
        
        const data = await response.json();
        setRecipes(data.data || []);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách công thức:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipes();
  }, []);

  const handleApproveRecipe = async (recipeId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/recipes/${recipeId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Cập nhật lại danh sách công thức
        setRecipes(recipes.map(recipe => 
          recipe.id === recipeId ? { ...recipe, status: 'published' } : recipe
        ));
      }
    } catch (error) {
      console.error('Lỗi khi phê duyệt công thức:', error);
    }
  };

  const handleRejectRecipe = async (recipeId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/recipes/${recipeId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Cập nhật lại danh sách công thức
        setRecipes(recipes.map(recipe => 
          recipe.id === recipeId ? { ...recipe, status: 'rejected' } : recipe
        ));
      }
    } catch (error) {
      console.error('Lỗi khi từ chối công thức:', error);
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (window.confirm('Bạn có chắc muốn xóa công thức này không?')) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`http://localhost:5000/api/admin/recipes/${recipeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Xóa công thức khỏi danh sách
          setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
        }
      } catch (error) {
        console.error('Lỗi khi xóa công thức:', error);
      }
    }
  };

  const filteredRecipes = filterStatus === 'all' 
    ? recipes 
    : recipes.filter(recipe => recipe.status === filterStatus);

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="admin-recipes-page">
      <h2>Quản lý công thức</h2>
      
      <div className="filter-controls">
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="status-filter"
        >
          <option value="all">Tất cả công thức</option>
          <option value="pending_review">Chờ duyệt</option>
          <option value="published">Đã xuất bản</option>
          <option value="rejected">Đã từ chối</option>
          <option value="draft">Bản nháp</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {filteredRecipes.length === 0 ? (
        <div className="no-recipes">
          <p>Không có công thức nào {filterStatus !== 'all' ? `có trạng thái "${filterStatus}"` : ''}</p>
        </div>
      ) : (
        <table className="recipes-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tiêu đề</th>
              <th>Tác giả</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipes.map(recipe => (
              <tr key={recipe.id}>
                <td>{recipe.id}</td>
                <td>
                  <a href={`/recipe/${recipe.id}`} target="_blank" rel="noopener noreferrer">
                    {recipe.title}
                  </a>
                </td>
                <td>{recipe.author_name}</td>
                <td>{new Date(recipe.created_at).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${recipe.status}`}>
                    {recipe.status === 'published' ? 'Đã xuất bản' : 
                     recipe.status === 'pending_review' ? 'Chờ duyệt' : 
                     recipe.status === 'rejected' ? 'Đã từ chối' : 'Bản nháp'}
                  </span>
                </td>
                <td className="action-buttons">
                  {recipe.status === 'pending_review' && (
                    <>
                      <button 
                        onClick={() => handleApproveRecipe(recipe.id)}
                        className="approve-button"
                      >
                        Phê duyệt
                      </button>
                      <button 
                        onClick={() => handleRejectRecipe(recipe.id)}
                        className="reject-button"
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="delete-button"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminRecipesPage;