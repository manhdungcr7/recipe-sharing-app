import React, { useState, useEffect } from 'react';
import './AdminRecipesPage.css';

const AdminRecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalRecipe, setModalRecipe] = useState(null);

  const fetchRecipes = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Xây dựng query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      // Gọi API với các bộ lọc
      const response = await fetch(`http://localhost:5000/api/admin/recipes?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách công thức');
      }
      
      const data = await response.json();
      setRecipes(data.data || []);
      setTotalPages(data.pagination.totalPages || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(currentPage);
  }, [currentPage, filterStatus]);

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecipes(1);
  };

  // Xử lý chọn công thức
  const handleSelectRecipe = (recipeId) => {
    if (selectedRecipes.includes(recipeId)) {
      setSelectedRecipes(selectedRecipes.filter(id => id !== recipeId));
    } else {
      setSelectedRecipes([...selectedRecipes, recipeId]);
    }
  };

  // Xử lý chọn tất cả công thức
  const handleSelectAll = () => {
    if (selectedRecipes.length === recipes.length) {
      setSelectedRecipes([]);
    } else {
      setSelectedRecipes(recipes.map(recipe => recipe.id));
    }
  };

  // Xử lý hành động hàng loạt
  const handleBulkAction = async () => {
    if (!bulkAction || selectedRecipes.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      
      let endpoint = '';
      switch (bulkAction) {
        case 'approve':
          endpoint = '/api/admin/recipes/batch-approve';
          break;
        case 'reject':
          endpoint = '/api/admin/recipes/batch-reject';
          break;
        case 'delete':
          endpoint = '/api/admin/recipes/batch-delete';
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
        body: JSON.stringify({ recipeIds: selectedRecipes })
      });
      
      if (!response.ok) {
        throw new Error('Không thể thực hiện hành động hàng loạt');
      }
      
      // Làm mới danh sách
      fetchRecipes(currentPage);
      setSelectedRecipes([]);
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

  // Hiển thị modal chi tiết công thức
  const showRecipeDetails = (recipe) => {
    setModalRecipe(recipe);
    setShowModal(true);
  };

  // Xử lý phê duyệt công thức
  const handleApproveRecipe = async (recipeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/recipes/${recipeId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Không thể phê duyệt công thức');
      }
      
      // Cập nhật danh sách
      setRecipes(recipes.map(recipe => 
        recipe.id === recipeId ? {...recipe, status: 'published'} : recipe
      ));
    } catch (err) {
      console.error('Error approving recipe:', err);
      setError(err.message);
    }
  };

  // Xử lý từ chối công thức
  const handleRejectRecipe = async (recipeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/recipes/${recipeId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Không thể từ chối công thức');
      }
      
      // Cập nhật danh sách
      setRecipes(recipes.map(recipe => 
        recipe.id === recipeId ? {...recipe, status: 'rejected'} : recipe
      ));
    } catch (err) {
      console.error('Error rejecting recipe:', err);
      setError(err.message);
    }
  };

  // Xử lý xóa công thức
  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công thức này?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Không thể xóa công thức');
      }
      
      // Cập nhật danh sách
      setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError(err.message);
    }
  };

  if (loading && recipes.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Đang tải danh sách công thức...</p>
      </div>
    );
  }

  return (
    <div className="admin-recipes">
      <div className="admin-page-header">
        <h1>Quản lý công thức</h1>
      </div>

      {/* Filters and Search */}
      <div className="admin-tools">
        <div className="admin-filters">
          <div className="filter">
            <label>Trạng thái:</label>
            <select value={filterStatus} onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}>
              <option value="all">Tất cả</option>
              <option value="pending_review">Chờ duyệt</option>
              <option value="published">Đã xuất bản</option>
              <option value="rejected">Đã từ chối</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
        </div>
        
        <form className="admin-search" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Tìm theo tiêu đề, tên tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">
            <i className="fas fa-search"></i>
          </button>
        </form>
      </div>

      {/* Bulk Actions */}
      {selectedRecipes.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedRecipes.length} công thức đã chọn</span>
          <select 
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="">-- Chọn hành động --</option>
            <option value="approve">Phê duyệt</option>
            <option value="reject">Từ chối</option>
            <option value="delete">Xóa</option>
          </select>
          <button 
            className="btn-apply"
            disabled={!bulkAction}
            onClick={handleBulkAction}
          >
            Áp dụng
          </button>
          <button className="btn-clear" onClick={() => setSelectedRecipes([])}>
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

      {/* Recipes Table */}
      <div className="admin-table-responsive">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  checked={selectedRecipes.length === recipes.length && recipes.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>ID</th>
              <th>Tiêu đề</th>
              <th>Tác giả</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {recipes.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  {searchQuery || filterStatus !== 'all' ? 
                    'Không tìm thấy công thức nào phù hợp' : 
                    'Chưa có công thức nào'
                  }
                </td>
              </tr>
            ) : (
              recipes.map(recipe => (
                <tr key={recipe.id}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedRecipes.includes(recipe.id)}
                      onChange={() => handleSelectRecipe(recipe.id)}
                    />
                  </td>
                  <td>{recipe.id}</td>
                  <td className="recipe-info">
                    <img 
                      src={recipe.image_url ? `http://localhost:5000${recipe.image_url}` : 'https://via.placeholder.com/40'}
                      alt={recipe.title}
                      className="recipe-image-small"
                    />
                    <span className="recipe-title">{recipe.title}</span>
                  </td>
                  <td>{recipe.author_name || 'Không xác định'}</td>
                  <td>{new Date(recipe.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`status-badge ${recipe.status}`}>
                      {recipe.status === 'published' ? 'Đã xuất bản' : 
                       recipe.status === 'pending_review' ? 'Chờ duyệt' : 
                       recipe.status === 'rejected' ? 'Đã từ chối' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-view" onClick={() => showRecipeDetails(recipe)}>
                      <i className="fas fa-eye"></i>
                    </button>
                    
                    {recipe.status === 'pending_review' && (
                      <>
                        <button className="btn-approve" onClick={() => handleApproveRecipe(recipe.id)}>
                          <i className="fas fa-check"></i>
                        </button>
                        <button className="btn-reject" onClick={() => handleRejectRecipe(recipe.id)}>
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    )}
                    
                    <button className="btn-delete" onClick={() => handleDeleteRecipe(recipe.id)}>
                      <i className="fas fa-trash-alt"></i>
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

      {/* Recipe Detail Modal */}
      {showModal && modalRecipe && (
        <div className="admin-modal">
          <div className="modal-content recipe-modal">
            <div className="modal-header">
              <h2>Chi tiết công thức</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="recipe-modal-image">
                <img 
                  src={modalRecipe.image_url ? `http://localhost:5000${modalRecipe.image_url}` : 'https://via.placeholder.com/400x250?text=No+Image'}
                  alt={modalRecipe.title}
                />
              </div>
              
              <h3 className="recipe-title">{modalRecipe.title}</h3>
              
              <div className="recipe-meta">
                <div className="meta-item">
                  <i className="fas fa-user"></i>
                  <span>Tác giả: {modalRecipe.author_name || 'Không xác định'}</span>
                </div>
                <div className="meta-item">
                  <i className="fas fa-clock"></i>
                  <span>Thời gian nấu: {modalRecipe.cooking_time} phút</span>
                </div>
                <div className="meta-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>Ngày tạo: {new Date(modalRecipe.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="meta-item">
                  <i className="fas fa-tag"></i>
                  <span>Trạng thái: 
                    <span className={`status-badge ${modalRecipe.status}`}>
                      {modalRecipe.status === 'published' ? 'Đã xuất bản' : 
                       modalRecipe.status === 'pending_review' ? 'Chờ duyệt' : 
                       modalRecipe.status === 'rejected' ? 'Đã từ chối' : 'Bản nháp'}
                    </span>
                  </span>
                </div>
              </div>
              
              {modalRecipe.description && (
                <div className="recipe-section">
                  <h4>Mô tả</h4>
                  <p>{modalRecipe.description}</p>
                </div>
              )}
              
              {modalRecipe.ingredients && modalRecipe.ingredients.length > 0 && (
                <div className="recipe-section">
                  <h4>Nguyên liệu</h4>
                  <ul className="ingredients-list">
                    {modalRecipe.ingredients.map((ingredient, index) => (
                      <li key={index}>
                        <span className="ingredient-name">{ingredient.name}</span>
                        {ingredient.quantity && ingredient.unit && (
                          <span className="ingredient-amount">
                            {ingredient.quantity} {ingredient.unit}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {modalRecipe.steps && modalRecipe.steps.length > 0 && (
                <div className="recipe-section">
                  <h4>Các bước thực hiện</h4>
                  <ol className="steps-list">
                    {modalRecipe.steps.map((step, index) => (
                      <li key={index}>
                        <div className="step-content">
                          <p>{step.description}</p>
                          {step.image_url && (
                            <img 
                              src={`http://localhost:5000${step.image_url}`}
                              alt={`Bước ${index + 1}`}
                              className="step-image"
                            />
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              
              {modalRecipe.thoughts && (
                <div className="recipe-section">
                  <h4>Cảm nghĩ của tác giả</h4>
                  <p>{modalRecipe.thoughts}</p>
                </div>
              )}
              
              {modalRecipe.status === 'pending_review' && (
                <div className="modal-actions">
                  <button className="btn-reject" onClick={() => {
                    handleRejectRecipe(modalRecipe.id);
                    setShowModal(false);
                  }}>
                    <i className="fas fa-times"></i> Từ chối
                  </button>
                  <button className="btn-approve" onClick={() => {
                    handleApproveRecipe(modalRecipe.id);
                    setShowModal(false);
                  }}>
                    <i className="fas fa-check"></i> Phê duyệt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecipesPage;