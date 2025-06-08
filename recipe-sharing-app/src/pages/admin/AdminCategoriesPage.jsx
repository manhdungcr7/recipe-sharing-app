import React, { useState, useEffect } from 'react';
import './AdminCategoriesPage.css';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:5000/api/admin/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Không thể tải danh mục');
        }

        const data = await response.json();
        setCategories(data.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message);
        
        // Dữ liệu mẫu để hiển thị UI
        setCategories([
          { id: 1, name: 'Món Việt', description: 'Các món ăn Việt Nam truyền thống', recipe_count: 15 },
          { id: 2, name: 'Món Âu', description: 'Các món ăn phương Tây', recipe_count: 8 },
          { id: 3, name: 'Đồ ngọt', description: 'Bánh ngọt và đồ tráng miệng', recipe_count: 12 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Xử lý thêm mới
  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  // Xử lý chỉnh sửa
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setShowModal(true);
  };

  // Xử lý xóa
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Không thể xóa danh mục');
      }

      setCategories(categories.filter(category => category.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.message);
    }
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingCategory 
        ? `http://localhost:5000/api/admin/categories/${editingCategory.id}` 
        : 'http://localhost:5000/api/admin/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(editingCategory ? 'Không thể cập nhật danh mục' : 'Không thể thêm danh mục mới');
      }

      const data = await response.json();
      
      if (editingCategory) {
        setCategories(categories.map(cat => cat.id === editingCategory.id ? data.data : cat));
      } else {
        setCategories([...categories, data.data]);
      }
      
      setShowModal(false);
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.message);
    }
  };

  // Xử lý thay đổi input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Đang tải danh mục...</p>
      </div>
    );
  }

  return (
    <div className="admin-categories">
      <div className="admin-page-header">
        <h1>Quản lý danh mục</h1>
        <button className="btn-add" onClick={handleAdd}>
          <i className="fas fa-plus"></i> Thêm danh mục
        </button>
      </div>

      {error && (
        <div className="admin-error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="admin-table-responsive">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên danh mục</th>
              <th>Mô tả</th>
              <th>Số công thức</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">Chưa có danh mục nào</td>
              </tr>
            ) : (
              categories.map(category => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td>{category.name}</td>
                  <td>{category.description || '-'}</td>
                  <td>{category.recipe_count || 0}</td>
                  <td className="actions">
                    <button className="btn-edit" onClick={() => handleEdit(category)}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDelete(category.id)}
                      disabled={category.recipe_count > 0}
                      title={category.recipe_count > 0 ? "Không thể xóa danh mục có công thức" : "Xóa danh mục"}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal form */}
      {showModal && (
        <div className="admin-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Tên danh mục</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Mô tả</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                  ></textarea>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn-save">
                    {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;