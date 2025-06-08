import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateRecipePage.css';
import { getAuthToken, getAuthHeaders, apiRequest } from '../utils/apiUtils';

const CreateRecipePage = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [cookingTime, setCookingTime] = useState('');
    const [thoughts, setThoughts] = useState('');
    const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: '' }]);
    const [steps, setSteps] = useState([{ description: '', image: null, imagePreview: null }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        // Kiểm tra đăng nhập trước khi làm gì khác
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Bạn cần đăng nhập để tạo công thức mới");
            // Lưu đường dẫn hiện tại để quay lại sau khi đăng nhập
            localStorage.setItem('redirectAfterLogin', '/create-recipe');
            // Chuyển hướng đến trang đăng nhập
            navigate('/login');
            return;
        }
        
        // Nếu có dữ liệu đã lưu, khôi phục
        const savedForm = localStorage.getItem('recipeFormData');
        if (savedForm) {
            try {
                const formData = JSON.parse(savedForm);
                setTitle(formData.title || '');
                setCookingTime(formData.cookingTime || '');
                setThoughts(formData.thoughts || '');
                setIngredients(formData.ingredients || [{ name: '', quantity: '', unit: '' }]);
                
                // Khôi phục bước mà không khôi phục hình ảnh/video
                // Vì localStorage không thể lưu file
                setSteps(formData.steps?.map(step => ({
                    ...step,
                    image: null,
                    video: null,
                    imagePreview: null
                })) || [{ description: '', image: null, video: null, imagePreview: null }]);
                
                // Đã khôi phục xong, xóa data
                localStorage.removeItem('recipeFormData');
                alert("Đã khôi phục dữ liệu công thức bạn đang soạn thảo!");
            } catch (e) {
                console.error("Error restoring form:", e);
            }
        }
    }, [navigate]);
    
    useEffect(() => {
        // Kiểm tra xem có dữ liệu đã lưu không
        const savedData = localStorage.getItem('pendingRecipeData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                setTitle(data.title || '');
                setCookingTime(data.cookingTime || '');
                setThoughts(data.thoughts || '');
                setIngredients(data.ingredients || [{ name: '', quantity: '', unit: '' }]);
                
                // Khôi phục bước mà không khôi phục hình ảnh/video
                setSteps(data.steps?.map(step => ({
                    ...step,
                    image: null,
                    video: null,
                    imagePreview: null
                })) || [{ description: '', image: null, video: null, imagePreview: null }]);
                
                // Đã khôi phục xong, xóa data
                localStorage.removeItem('pendingRecipeData');
                alert('Đã khôi phục công thức bạn đang soạn trước đó!');
            } catch (e) {
                console.error('Error restoring recipe data:', e);
            }
        }
    }, []);
    
    // Tự động lưu form data mỗi 30 giây
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
            if (title || cookingTime || ingredients.length > 1 || steps.length > 1) {
                const formData = {
                    title,
                    cookingTime,
                    thoughts,
                    ingredients,
                    // Lưu mô tả của bước nhưng không lưu file
                    steps: steps.map(step => ({ description: step.description }))
                };
                localStorage.setItem('pendingRecipeData', JSON.stringify(formData));
                console.log('Form data auto-saved');
            }
        }, 30000);
        
        return () => clearInterval(autoSaveInterval);
    }, [title, cookingTime, thoughts, ingredients, steps]);
    
    // Xử lý thêm nguyên liệu
    const handleAddIngredient = () => {
        setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
    };
    
    // Xử lý xóa nguyên liệu
    const handleRemoveIngredient = (index) => {
        if (ingredients.length > 1) {
            const newIngredients = [...ingredients];
            newIngredients.splice(index, 1);
            setIngredients(newIngredients);
        }
    };
    
    // Xử lý thêm bước
    const handleAddStep = () => {
        setSteps([...steps, { description: '', image: null, imagePreview: null }]);
    };
    
    // Xử lý xóa bước
    const handleRemoveStep = (index) => {
        if (steps.length > 1) {
            const newSteps = [...steps];
            newSteps.splice(index, 1);
            setSteps(newSteps);
        }
    };
    
    // Xử lý thay đổi nguyên liệu
    const handleIngredientChange = (index, field, value) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        setIngredients(newIngredients);
    };
    
    // Xử lý thay đổi bước
    const handleStepChange = (index, value) => {
        const newSteps = [...steps];
        newSteps[index].description = value;
        setSteps(newSteps);
    };
    
    // Xử lý thay đổi hình ảnh cho bước
    const handleStepImageChange = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Kiểm tra kích thước file (giới hạn 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
            return;
        }
        
        // Kiểm tra loại file
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file hình ảnh.');
            return;
        }
        
        const newSteps = [...steps];
        newSteps[index].image = file;
        
        // Tạo preview của hình ảnh
        const reader = new FileReader();
        reader.onloadend = () => {
            newSteps[index].imagePreview = reader.result;
            setSteps(newSteps);
        };
        reader.readAsDataURL(file);
    };
    
    // Xử lý thay đổi hình ảnh chính
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Kiểm tra kích thước file (giới hạn 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.');
            return;
        }
        
        setImage(file);
        
        // Tạo preview của hình ảnh
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Sửa hàm getAuthToken
    const getAuthToken = () => {
      // THỐNG NHẤT SỬ DỤNG KEY 'token'
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No auth token found in localStorage");
        return null;
      }
      
      console.log("Auth token found in localStorage:", token.substring(0, 10) + "...");
      return token;
    };

    // Kiểm tra trạng thái đăng nhập
    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = getAuthToken();
            if (!token) {
              alert("Bạn cần đăng nhập để tạo công thức mới");
              localStorage.setItem('redirectAfterLogin', '/create-recipe');
              navigate('/login');
              return;
            }
        
            // Kiểm tra token có hợp lệ không thông qua API
            try {
              const response = await apiRequest('/api/auth/me');
        
              if (!response.ok) {
                // Token không hợp lệ hoặc hết hạn
                localStorage.removeItem('token');
                localStorage.setItem('redirectAfterLogin', '/create-recipe');
                alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                navigate('/login');
                return;
              }
        
              // Token hợp lệ - tiếp tục với trang tạo công thức
              const data = await response.json();
              console.log("Authenticated as:", data.data?.name || "Unknown user");
            } catch (error) {
              console.error("Error checking authentication:", error);
              // Không chuyển hướng trong trường hợp lỗi mạng
              setError("Không thể kiểm tra trạng thái đăng nhập. Vui lòng kiểm tra kết nối mạng.");
            }
        };
        
        checkAuthStatus();
    }, [navigate]);
    
    // Xử lý nút "Đăng công thức"
    const handlePublishRecipe = async () => {
  try {
    // Validate dữ liệu đầu vào
    
    setIsSubmitting(true);
    
    // Lấy token xác thực
    const token = getAuthToken();
    if (!token) {
      setError("Bạn cần đăng nhập để đăng công thức. Đang chuyển hướng...");
      setIsSubmitting(false);
      
      // Lưu đường dẫn hiện tại để quay lại sau khi đăng nhập
      localStorage.setItem('redirectAfterLogin', '/create-recipe');
      
      // Chờ 2 giây trước khi chuyển hướng
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    const formData = new FormData();
    
    // Thêm các trường dữ liệu
    formData.append('title', title);
    formData.append('cookingTime', cookingTime);
    formData.append('thoughts', thoughts);
    formData.append('status', 'published');
    
    // Thêm hình ảnh chính
    if (image) {
      formData.append('image', image);
    }
    
    // Thêm các nguyên liệu
    formData.append('ingredients', JSON.stringify(ingredients));
    
    // Thêm các bước
    formData.append('steps', JSON.stringify(steps.map(step => ({
      description: step.description
    }))));

    // Thêm hình ảnh cho từng bước (không thêm video)
    steps.forEach((step, index) => {
      if (step.image) {
        formData.append(`step_images[${index}]`, step.image);
      }
    });
    
    // Log data để debug
    console.log("Sending with token:", token.substring(0, 15) + "...");

    // Gửi request với token trong header
    const response = await fetch('http://localhost:5000/api/recipes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    // Kiểm tra response có phải là JSON không
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Server returned non-JSON response:", text);
      throw new Error("Máy chủ trả về dữ liệu không hợp lệ");
    }
    
    if (!response.ok) {
      // Kiểm tra lỗi 401
      if (response.status === 401) {
        // Token hết hạn hoặc không hợp lệ
        localStorage.removeItem('token');
        localStorage.setItem('redirectAfterLogin', '/create-recipe');
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
      
      throw new Error(data.message || 'Không thể tạo công thức');
    }
    
    // Xử lý thành công
    setSuccess(true);
    
    // Lấy ID công thức từ response
    const recipeId = data.data?.id;
    console.log("Created recipe with ID:", recipeId);
    
    if (!recipeId) {
      console.error("Recipe ID not found in response:", data);
    }
    
    // Chuyển đến trang chi tiết công thức với ID đúng
    setTimeout(() => {
      navigate(`/recipe/${recipeId}`);
    }, 2000);
    
  } catch (error) {
    console.error("Error creating recipe:", error);
    setError(error.message || "Đã có lỗi xảy ra khi tạo công thức");
  } finally {
    setIsSubmitting(false);
  }
};
    
    // Xử lý nút "Lưu bản nháp"
    const handleSaveDraft = async () => {
        if (!title) {
            setError('Vui lòng nhập tên món ăn');
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            // Lấy token bằng hàm getAuthToken đã chuẩn hóa
            const token = getAuthToken();
            if (!token) {
                setError("Bạn cần đăng nhập để lưu bản nháp công thức");
                setLoading(false);
                return;
            }
            
            // Tạo FormData để gửi cả file và dữ liệu
            const formData = new FormData();
            formData.append('title', title);
            formData.append('cookingTime', cookingTime || '0');
            formData.append('thoughts', thoughts || '');
            formData.append('status', 'draft'); // Trạng thái bản nháp
            
            // Thêm hình ảnh món ăn nếu có
            if (image) {
                formData.append('image', image);
            }
            
            // Thêm nguyên liệu dưới dạng JSON (có thể rỗng cho bản nháp)
            formData.append('ingredients', JSON.stringify(ingredients));
            
            // Chuẩn bị steps (không có hình ảnh/video lúc này)
            const stepsData = steps.map(step => ({ description: step.description || '' }));
            formData.append('steps', JSON.stringify(stepsData));
            
            // Thêm step images riêng biệt
            steps.forEach((step, index) => {
                if (step.image) {
                    formData.append(`step_images[${index}]`, step.image);
                }
            });
            
            const response = await fetch('http://localhost:5000/api/recipes/draft', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Xóa dữ liệu công thức đã lưu
                localStorage.removeItem('recipeFormData');
                localStorage.removeItem('pendingRecipeData');
                
                // Hiển thị thông báo thành công
                alert('Công thức đã được lưu dưới dạng bản nháp');
                
                // Chuyển hướng về dashboard
                navigate('/dashboard');
            } else {
                const result = await response.json();
                throw new Error(result.message || 'Lỗi khi lưu bản nháp');
            }
        } catch (error) {
            setError(`Lỗi: ${error.message}`);
            console.error("Error saving draft:", error);
        } finally {
            setLoading(false);
        }
    };
    
    // Xử lý nút "Đăng công thức" - phiên bản mới
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Validate các trường input
            if (!title) {
                setError("Vui lòng nhập tên món ăn");
                return;
            }
            if (!cookingTime) {
                setError("Vui lòng nhập thời gian nấu");
                return;
            }
            
            setIsSubmitting(true);
            
            const formData = new FormData();
            
            // Thêm các trường dữ liệu
            formData.append('title', title);
            formData.append('cookingTime', cookingTime);
            formData.append('thoughts', thoughts);
            formData.append('status', 'published');
            
            // Thêm hình ảnh chính
            if (image) {
              formData.append('image', image);
            }
            
            // Thêm các nguyên liệu
            formData.append('ingredients', JSON.stringify(ingredients));
            
            // Thêm các bước
            formData.append('steps', JSON.stringify(steps.map(step => ({
              description: step.description
            }))));
            
            // Thêm hình ảnh cho từng bước (không thêm video)
            steps.forEach((step, index) => {
              if (step.image) {
                formData.append(`step_images[${index}]`, step.image);
              }
            });
            
            // Lấy token đúng - CHỈ SỬ DỤNG KEY 'token'
            const token = localStorage.getItem('token');
            
            // Kiểm tra token trước khi gửi request
            if (!token) {
              setError('Không tìm thấy thông tin xác thực. Vui lòng đăng nhập lại.');
              localStorage.removeItem('user');
              setTimeout(() => navigate('/login'), 2000);
              return;
            }
            
            const response = await fetch('http://localhost:5000/api/recipes', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });
            
            // Xử lý phản hồi
            const data = await response.json();
            
            if (!response.ok) {
              // Xử lý khi server trả về lỗi
              if (response.status === 401) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => navigate('/login'), 2000);
                return;
              }
              
              throw new Error(data.message || 'Có lỗi xảy ra khi tạo công thức.');
            }
            
            // Xử lý thành công
            setSuccess(true);
            
            // Lấy ID công thức vừa tạo
            const recipeId = data.data?.id;
            console.log("Created recipe with ID:", recipeId);
            
            // Xóa dữ liệu trong localStorage
            localStorage.removeItem('recipe_draft');
            localStorage.removeItem('pendingRecipeData');
            
            // Chờ 2s và chuyển hướng
            setTimeout(() => {
              navigate(`/recipe/${recipeId}`);
            }, 2000);
            
        } catch (err) {
            console.error('Error creating recipe:', err);
            setError(err.message || 'Lỗi kết nối đến server. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="create-recipe-page">
            <h1>Tạo công thức mới</h1>
            
            {error && (
  <div className="error-message">
    <i className="fas fa-exclamation-circle"></i>
    {error}
  </div>
)}

{isSubmitting && (
  <div className="overlay">
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Đang tạo công thức...</p>
    </div>
  </div>
)}

            {success && <div className="success-message">Công thức đã được đăng thành công!</div>}
            
            <form onSubmit={handleSubmit} className="recipe-form" encType="multipart/form-data">
                {/* Tên món ăn */}
                <div className="form-group">
                    <label htmlFor="title">Tên món ăn *</label>
                    <input 
                        type="text" 
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Nhập tên món ăn"
                        required
                    />
                </div>
                
                {/* Hình ảnh */}
                <div className="form-group">
                    <label htmlFor="image">Hình ảnh món ăn</label>
                    <input 
                        type="file" 
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    {imagePreview && (
                        <div className="image-preview">
                            <img src={imagePreview} alt="Xem trước" />
                        </div>
                    )}
                </div>
                
                {/* Thời gian nấu */}
                <div className="form-group">
                    <label htmlFor="cookingTime">Thời gian nấu (phút) *</label>
                    <input 
                        type="number" 
                        id="cookingTime"
                        value={cookingTime}
                        onChange={(e) => setCookingTime(e.target.value)}
                        min="1"
                        placeholder="Nhập thời gian nấu"
                        required
                    />
                </div>
                
                {/* Nguyên liệu */}
                <div className="form-group">
                    <h3>Nguyên liệu *</h3>
                    {ingredients.map((ingredient, index) => (
                        <div key={index} className="ingredient-row">
                            <input
                                type="text"
                                placeholder="Tên nguyên liệu"
                                value={ingredient.name}
                                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Số lượng"
                                value={ingredient.quantity}
                                onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Đơn vị (g, ml...)"
                                value={ingredient.unit}
                                onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                            />
                            {ingredients.length > 1 && (
                                <button 
                                    type="button" 
                                    className="btn-remove" 
                                    onClick={() => handleRemoveIngredient(index)}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" className="btn-add" onClick={handleAddIngredient}>
                        <i className="fas fa-plus"></i> Thêm nguyên liệu
                    </button>
                </div>
                
                {/* Các bước nấu */}
                <div className="form-group">
                    <h3>Các bước *</h3>
                    <div className="info-message">
        <i className="fas fa-info-circle"></i> Chỉ hỗ trợ tải lên hình ảnh cho từng bước. Video không được hỗ trợ vì kích thước tệp quá lớn.
    </div>
                    {steps.map((step, index) => (
                        <div key={index} className="step-row">
                            <div className="step-header">
                                <span className="step-number">Bước {index + 1}</span>
                                {steps.length > 1 && (
                                    <button 
                                        type="button" 
                                        className="btn-remove" 
                                        onClick={() => handleRemoveStep(index)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>
                            <textarea
                                placeholder={`Mô tả chi tiết cho bước ${index + 1}`}
                                value={step.description || ''} 
                                onChange={(e) => handleStepChange(index, e.target.value)}
                                required
                                rows="3"
                            />
                            <div className="step-media">
                                <div className="media-input">
                                    <label>
                                        <i className="fas fa-image"></i> Thêm hình ảnh
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => handleStepImageChange(index, e)}
                                            style={{display: 'none'}}
                                        />
                                    </label>
                                </div>
                                
                                {step.imagePreview && (
                                    <div className="media-preview">
                                        <img src={step.imagePreview} alt={`Bước ${index + 1}`} />
                                        <button 
                                            type="button" 
                                            className="btn-remove-media" 
                                            onClick={() => {
                                                // Code xóa ảnh
                                                const newSteps = [...steps];
                                                newSteps[index].image = null;
                                                newSteps[index].imagePreview = null;
                                                setSteps(newSteps);
                                            }}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn-add" onClick={handleAddStep}>
                        <i className="fas fa-plus"></i> Thêm bước
                    </button>
                </div>
                
                {/* Suy nghĩ và cảm nhận */}
                <div className="form-group">
                    <label htmlFor="thoughts">Suy nghĩ và cảm nhận về món ăn</label>
                    <textarea 
                        id="thoughts"
                        value={thoughts || ''} 
                        onChange={(e) => setThoughts(e.target.value)}
                        placeholder="Chia sẻ câu chuyện, cảm nhận của bạn về món ăn này..."
                        rows={4} 
                    /> 
                </div>
                
                {/* Nút hành động */}
                <div className="form-actions">
                    <button 
    type="button"
    className="secondary-button"
    disabled={isSubmitting}
    onClick={handleSaveDraft}
  >
    <i className="fas fa-save"></i> Lưu bản nháp
  </button>
  
  <button 
    type="submit"
    className="primary-button"
    disabled={isSubmitting}
  >
    <i className="fas fa-paper-plane"></i> {isSubmitting ? 'Đang xử lý...' : 'Đăng công thức'}
  </button>
                </div>
            </form>
        </div>
    );
};

export default CreateRecipePage;