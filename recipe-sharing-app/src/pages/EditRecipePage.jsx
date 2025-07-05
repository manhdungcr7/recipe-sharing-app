import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './CreateRecipePage.css'; // Sử dụng lại CSS từ CreateRecipePage

const EditRecipePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  
  // State giống như CreateRecipePage
  const [title, setTitle] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cookingTime, setCookingTime] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: '' }]);
  const [steps, setSteps] = useState([{ description: '', image: null, imagePreview: null }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublished, setIsPublished] = useState(false); // Biến kiểm tra là bản đã đăng hay bản nháp
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    if (!isAuthenticated) {
      alert("Bạn cần đăng nhập để chỉnh sửa công thức");
      localStorage.setItem('redirectAfterLogin', `/edit-recipe/${id}`);
      navigate('/login');
      return;
    }
    
    fetchRecipeData();
  }, [id, isAuthenticated, navigate]);

  const fetchRecipeData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Bạn cần đăng nhập để chỉnh sửa công thức");
        return;
      }

      // Thử lấy từ API bản nháp trước
      let response = await fetch(`http://localhost:5000/api/recipes/draft/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Nếu không phải bản nháp, thử lấy từ API công thức đã đăng
      if (response.status === 404) {
        setIsPublished(true);
        response = await fetch(`http://localhost:5000/api/recipes/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Bạn không có quyền chỉnh sửa công thức này");
        } else if (response.status === 404) {
          throw new Error("Không tìm thấy công thức");
        } else {
          throw new Error("Không thể tải thông tin công thức");
        }
      }
      
      const data = await response.json();
      const recipe = data.data;
      
      // Kiểm tra quyền chỉnh sửa
      if (recipe.author_id !== currentUser?.id) {
        throw new Error("Bạn không có quyền chỉnh sửa công thức này");
      }
      
      // Đổ dữ liệu vào form
      setTitle(recipe.title || '');
      setCookingTime(recipe.cooking_time || '');
      setThoughts(recipe.thoughts || '');
      setOriginalImageUrl(recipe.image_url || '');
      setImagePreview(recipe.image_url ? `http://localhost:5000${recipe.image_url}` : null);
      
      // Đổ dữ liệu nguyên liệu
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        const formattedIngredients = recipe.ingredients.map(ing => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit
        }));
        setIngredients(formattedIngredients);
      } else {
        setIngredients([{ name: '', quantity: '', unit: '' }]);
      }
      
      // Đổ dữ liệu các bước
      if (recipe.steps && recipe.steps.length > 0) {
        const formattedSteps = recipe.steps.map(step => ({
          description: step.description,
          image: null,
          imagePreview: step.image_url ? `http://localhost:5000${step.image_url}` : null
        }));
        setSteps(formattedSteps);
      } else {
        setSteps([{ description: '', image: null, imagePreview: null }]);
      }
      
    } catch (error) {
      console.error('Error fetching recipe data:', error);
      setError(error.message || 'Không thể tải thông tin công thức');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thêm nguyên liệu
  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  // Xử lý xóa nguyên liệu
  const handleRemoveIngredient = (index) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  // Xử lý thay đổi nguyên liệu
  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  // Xử lý thêm bước
  const handleAddStep = () => {
    setSteps([...steps, { description: '', image: null, imagePreview: null }]);
  };

  // Xử lý xóa bước
  const handleRemoveStep = (index) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  // Xử lý thay đổi bước
  const handleStepChange = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  // Xử lý thay đổi hình ảnh bước - sửa lại như sau
  const handleStepImageChange = (e, index) => {
    // Đảm bảo index là số hợp lệ
    if (index === undefined || index < 0 || index >= steps.length) {
      console.error("Invalid step index:", index);
      return;
    }
    
    // Kiểm tra e và e.target trước khi truy cập e.target.files
    if (!e || !e.target || !e.target.files) {
      console.error("Invalid event object in handleStepImageChange", e);
      return;
    }
    
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSteps = [...steps];
        newSteps[index].image = file;
        newSteps[index].imagePreview = reader.result;
        setSteps(newSteps);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý thay đổi hình ảnh chính
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(file);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý lưu thay đổi
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    try {
      // Validate
      if (!title) {
        setError('Vui lòng nhập tên món ăn');
        return;
      }
      
      setIsSubmitting(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Bạn cần đăng nhập để lưu thay đổi');
        return;
      }
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('cookingTime', cookingTime || '0');
      formData.append('thoughts', thoughts || '');
      
      // Thêm hình ảnh mới nếu có
      if (image) {
        formData.append('image', image);
      }
      
      // Thêm dữ liệu nguyên liệu
      formData.append('ingredients', JSON.stringify(ingredients));
      
      // Thêm dữ liệu các bước
      formData.append('steps', JSON.stringify(steps.map(step => ({
        description: step.description
      }))));
      
      // Thêm hình ảnh cho từng bước nếu có
      steps.forEach((step, index) => {
        if (step.image) {
          formData.append(`step_images[${index}]`, step.image);
        }
      });
      
      // Gọi API cập nhật
      let url = isPublished 
        ? `http://localhost:5000/api/recipes/${id}` 
        : `http://localhost:5000/api/recipes/draft/${id}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật công thức');
      }
      
      setSuccess(true);
      alert(isPublished ? 'Đã cập nhật công thức thành công!' : 'Đã lưu bản nháp thành công!');
      
      // Chuyển hướng về trang chi tiết công thức nếu đã publish, hoặc về dashboard nếu là draft
      setTimeout(() => {
        if (isPublished) {
          navigate(`/recipe/${id}`);
        } else {
          localStorage.setItem('activeProfileTab', 'drafts');
          navigate('/dashboard');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error updating recipe:', error);
      setError(error.message || 'Đã có lỗi xảy ra khi cập nhật công thức');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý đăng bản nháp
  const handlePublishDraft = async () => {
    if (!isPublished) {
      if (window.confirm('Bạn có chắc muốn đăng công thức này?')) {
        try {
          setIsSubmitting(true);
          
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/recipes/draft/${id}/publish`, {
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
          setSuccess(true);
          alert('Đã đăng công thức thành công!');
          
          // Chuyển hướng đến trang chi tiết công thức
          setTimeout(() => {
            navigate(`/recipe/${data.data.id}`);
          }, 1000);
          
        } catch (error) {
          console.error('Error publishing draft:', error);
          setError(error.message || 'Đã có lỗi xảy ra khi đăng công thức');
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  // Thêm form UI
  return (
    <div className="create-recipe-page">
      <div className="page-header">
        <div className="container">
          <h1>{isPublished ? 'Chỉnh sửa công thức' : 'Chỉnh sửa bản nháp'}</h1>
        </div>
      </div>
      
      <div className="container">
        <div className="create-recipe-container">
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              {isPublished 
                ? 'Công thức đã được cập nhật thành công!' 
                : 'Bản nháp đã được lưu thành công!'}
            </div>
          )}
          
          <form onSubmit={handleSaveChanges}>
            {/* Tiêu đề */}
            <div className="form-group">
              <label htmlFor="title">Tên món ăn <span className="required">*</span></label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tên món ăn"
                required
              />
            </div>

            {/* Hình ảnh chính */}
            <div className="form-group">
              <label htmlFor="image">Hình ảnh món ăn</label>
              <div className="image-upload-container">
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button 
                      type="button" 
                      className="remove-image"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <div className="image-upload">
                    <label htmlFor="image-upload" className="upload-label">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>Tải lên hình ảnh</span>
                    </label>
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Thời gian nấu */}
            <div className="form-group">
              <label htmlFor="cookingTime">Thời gian nấu (phút)</label>
              <input
                type="number"
                id="cookingTime"
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                placeholder="Nhập thời gian nấu"
                min="0"
              />
            </div>

            {/* Suy nghĩ của tác giả */}
            <div className="form-group">
              <label htmlFor="thoughts">Suy nghĩ của tác giả</label>
              <textarea
                id="thoughts"
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                placeholder="Chia sẻ cảm nghĩ, nguồn gốc, hay câu chuyện về món ăn này..."
                rows="4"
              ></textarea>
            </div>

            {/* Nguyên liệu */}
            <div className="form-group">
              <label>Nguyên liệu</label>
              {ingredients.map((ingredient, index) => (
                <div key={index} className="ingredient-row">
                  <input
                    type="text"
                    placeholder="Tên nguyên liệu"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Số lượng"
                    value={ingredient.quantity}
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Đơn vị"
                    value={ingredient.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  />
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => handleRemoveIngredient(index)}
                    disabled={ingredients.length === 1}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-button"
                onClick={handleAddIngredient}
              >
                <i className="fas fa-plus"></i> Thêm nguyên liệu
              </button>
            </div>

            {/* Các bước làm */}
            <div className="form-group">
              <label>Các bước làm</label>
              {steps.map((step, index) => (
                <div key={index} className="step-container">
                  <div className="step-header">
                    <h3>Bước {index + 1}</h3>
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => handleRemoveStep(index)}
                      disabled={steps.length === 1}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  <textarea
                    placeholder="Mô tả bước thực hiện..."
                    value={step.description}
                    onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                    rows="3"
                  ></textarea>
                  <div className="step-image-container">
                    {step.imagePreview ? (
                      <div className="image-preview">
                        <img src={step.imagePreview} alt={`Preview bước ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => {
                            const newSteps = [...steps];
                            newSteps[index].image = null;
                            newSteps[index].imagePreview = null;
                            setSteps(newSteps);
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="image-upload">
                        <label htmlFor={`step-image-${index}`} className="upload-label">
                          <i className="fas fa-upload"></i> Thêm ảnh
                        </label>
                        <input
                          type="file"
                          id={`step-image-${index}`}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleStepImageChange(e, index)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="add-button"
                onClick={handleAddStep}
              >
                <i className="fas fa-plus"></i> Thêm bước
              </button>
            </div>
            
            <div className="form-actions">
              <button 
                type="button"
                className="secondary-button"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                <i className="fas fa-arrow-left"></i> Quay lại
              </button>
              
              {!isPublished && (
                <button
                  type="button"
                  className="action-button publish-button"
                  onClick={handlePublishDraft}
                  disabled={isSubmitting}
                >
                  <i className="fas fa-paper-plane"></i> Đăng công thức
                </button>
              )}
              
              <button 
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                <i className="fas fa-save"></i> {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              
              {/* Nút xóa bản nháp */}
              {!isPublished && (
                <button
                  className="action-button delete"
                  onClick={async () => {
                    if (window.confirm('Bạn có chắc muốn xóa bản nháp này không?')) {
                      try {
                        const token = localStorage.getItem('auth_token');
                        const response = await fetch(`http://localhost:5000/api/recipes/draft/${id}`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        if (!response.ok) throw new Error('Không thể xóa bản nháp');
                        alert('Đã xóa bản nháp thành công!');
                        navigate('/dashboard');
                      } catch (error) {
                        alert(error.message || 'Đã có lỗi xảy ra khi xóa bản nháp');
                      }
                    }
                  }}
                >
                  <i className="fas fa-trash"></i> Xóa bản nháp
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {isSubmitting && (
        <div className="overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>{isPublished ? 'Đang cập nhật công thức...' : 'Đang lưu bản nháp...'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditRecipePage;