import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/imageUtils';
import './RecipeDetailPage.css';
import Comments from '../components/comment/Comments';
import ChatbotButton from '../components/chatbot/ChatbotButton';
import ReportButton from '../components/report/ReportButton'; // Thêm import

const RecipeDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useContext(AuthContext);
    
    const [recipe, setRecipe] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chatbotOpen, setChatbotOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('info'); // Thêm state cho tab hiện tại
    
    // Xử lý tương tác
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [savesCount, setSavesCount] = useState(0);
    const [sharesCount, setSharesCount] = useState(0);

    // Thêm state
    const [showAuthorActions, setShowAuthorActions] = useState(false);

    // Tải dữ liệu công thức - sửa phần này
    useEffect(() => {
        const fetchRecipeData = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log(`Fetching recipe with ID: ${id}`);
                
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                
                const response = await fetch(`http://localhost:5000/api/recipes/${id}`, { headers });
                
                if (!response.ok) {
                    // Hiển thị thông tin chi tiết về lỗi
                    const errorText = await response.text();
                    console.error(`Error fetching recipe. Status: ${response.status}`, errorText);
                    
                    if (response.status === 404) {
                        throw new Error(`Không tìm thấy công thức với ID: ${id}. Vui lòng kiểm tra ID và thử lại.`);
                    } else if (response.status === 403) {
                        throw new Error(`Bạn không có quyền truy cập công thức này. Có thể đây là bản nháp của người khác.`);
                    } else {
                        throw new Error('Không thể tải công thức. Lỗi server.');
                    }
                }
                
                const result = await response.json();
                
                if (result && result.data) {
                    console.log("Recipe loaded:", result.data);
                    setRecipe(result.data);
                    
                    // Cập nhật trạng thái like/save và số lượng từ API trả về
                    setLiked(result.data.is_liked || false);
                    setSaved(result.data.is_saved || false);
                    
                    // Đảm bảo sử dụng likes_count thay vì likesCount để phù hợp với API
                    setLikesCount(result.data.likes_count || 0);
                    setSavesCount(result.data.saves_count || 0);
                    setSharesCount(result.data.shares || 0);
                    
                    // Tải bình luận
                    const commentsResponse = await fetch(`http://localhost:5000/api/comments/recipe/${id}`, { headers });
                    if (commentsResponse.ok) {
                        const commentsResult = await commentsResponse.json();
                        setComments(commentsResult.data || []);
                    }
                    
                    // Kiểm tra xem người đang xem có phải tác giả không
                    setShowAuthorActions(currentUser?.id === result.data.author_id);
                } else {
                    throw new Error('Định dạng dữ liệu không hợp lệ');
                }
            } catch (err) {
                setError(err.message || 'Không thể tải công thức. Vui lòng thử lại sau.');
                console.error('Error loading recipe:', err);
            } finally {
                setLoading(false);
            }
        };
        
        if (id) {
            fetchRecipeData();
        }
    }, [id, currentUser?.id, navigate]);
    
    // Xử lý thích công thức
    const handleLike = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/recipes/${id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Cập nhật trạng thái và số lượng like từ response API
                if (result.success) {
                    setLiked(result.data.liked);
                    
                    // Cập nhật số lượng like từ kết quả API trả về
                    setLikesCount(result.data.likesCount || 0);
                    
                    console.log(`Recipe ${id} like status updated:`, result.data);
                }
            } else {
                console.error("Failed to like recipe:", response.statusText);
            }
        } catch (err) {
            console.error('Error liking recipe:', err);
        }
    };
    
    // Xử lý lưu công thức
    const handleSave = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:5000/api/recipes/${id}/save`, {
                method: saved ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Cập nhật state local
                setSaved(!saved);
                
                // Cập nhật số lượng lưu
                setSavesCount(saved ? savesCount - 1 : savesCount + 1);
                
                // Thông báo thành công
                const message = saved ? 'Đã bỏ lưu công thức' : 'Đã lưu công thức thành công';
                console.log(message);
                
                // Có thể hiển thị thông báo cho người dùng
                // toast.success(message);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể lưu công thức');
            }
        } catch (err) {
            console.error('Error saving recipe:', err);
            // toast.error(`Lỗi: ${err.message}`);
        }
    };
    
    // Xử lý chia sẻ công thức
    const handleShare = async () => {
        try {
            // Copy link to clipboard
            const url = window.location.href;
            await navigator.clipboard.writeText(url);
            
            // Record share in backend
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:5000/api/recipes/${id}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (response.ok) {
                setSharesCount(prev => prev + 1);
            }
            
            alert('Đã sao chép liên kết vào bộ nhớ tạm!');
        } catch (err) {
            console.error('Error sharing recipe:', err);
            alert('Không thể chia sẻ công thức. Hãy thử lại sau.');
        }
    };
    
    // Xử lý tải PDF
    const handleDownloadPDF = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:5000/api/recipes/${id}/pdf`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${recipe.title}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Không thể tải PDF. Hãy thử lại sau.');
            }
        } catch (err) {
            console.error('Error downloading PDF:', err);
            alert('Không thể tải PDF. Hãy thử lại sau.');
        }
    };
    
    // Xử lý gửi bình luận
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            navigate('/login');
            return;
        }
        
        if (!commentText.trim()) return;
        
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:5000/api/comments/recipe/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: commentText })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.data) {
                    setComments(prev => [result.data, ...prev]);
                    setCommentText('');
                }
            }
        } catch (err) {
            console.error('Error posting comment:', err);
        }
    };
    
    // Toggle chatbot
    const toggleChatbot = () => {
        setChatbotOpen(!chatbotOpen);
    };
    
    const backgroundColor = React.useMemo(() => {
        const colors = [
            '#FFF8E1', '#F9FBE7', '#E8F5E9', '#E0F7FA', '#E8EAF6', 
            '#FCE4EC', '#FFF3E0', '#EFEBE9', '#F3E5F5', '#E1F5FE'
        ];
        
        // Tạo màu ổn định dựa trên ID
        const numericId = parseInt(id, 10) || 0;
        return colors[numericId % colors.length];
    }, [id]);
    
    // Hàm xử lý URL hình ảnh
    const getRecipeImageUrl = (imagePath) => {
      if (!imagePath) return "/default-recipe.jpg";
      
      // Thêm điều kiện kiểm tra bắt đầu bằng '/'
      if (imagePath.startsWith('http')) return imagePath;
      if (imagePath.startsWith('/')) return `http://localhost:5000${imagePath}`;
      return `http://localhost:5000/${imagePath}`; // Thêm / nếu không có
    };
    
    // Thêm hàm này vào component RecipeDetailPage
    const handleDeleteRecipe = async () => {
      if (window.confirm('Bạn có chắc chắn muốn xóa công thức này không?')) {
        try {
          setLoading(true);
          const token = localStorage.getItem('auth_token');
          
          // Sửa lại URL - sử dụng endpoint đúng theo vai trò người dùng
          const currentUser = JSON.parse(localStorage.getItem('user'));
          const isAdmin = currentUser && currentUser.role === 'admin';
          
          // Chọn URL dựa vào vai trò người dùng
          const url = isAdmin 
            ? `http://localhost:5000/api/admin/recipes/${id}`
            : `http://localhost:5000/api/recipes/${id}`;
          
          const response = await fetch(url, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể xóa công thức');
          }
          
          alert('Công thức đã được xóa thành công!');
          navigate('/dashboard');
          
        } catch (error) {
          console.error('Error deleting recipe:', error);
          alert(error.message || 'Đã có lỗi xảy ra khi xóa công thức');
        } finally {
          setLoading(false);
        }
      }
    };
    
    // Sau khi load xong comments:
    const params = new URLSearchParams(location.search);
    const highlightCommentId = params.get('comment');

    useEffect(() => {
      if (highlightCommentId) {
        const el = document.getElementById(`comment-${highlightCommentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-comment');
          setTimeout(() => el.classList.remove('highlight-comment'), 3000);
        }
      }
    }, [comments, highlightCommentId]);
    
    if (loading) {
        return <div className="loading-spinner">Đang tải công thức...</div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <h2>Không thể tải công thức</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/dashboard')}>Quay về trang chủ</button>
                <button onClick={() => window.location.reload()}>Thử lại</button>
            </div>
        );
    }

    if (!recipe) {
        return (
            <div className="error-container">
                <h2>Không tìm thấy công thức</h2>
                <p>Công thức bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                <button onClick={() => navigate('/dashboard')}>Quay về trang chủ</button>
            </div>
        );
    }

    return (
        <div className="recipe-detail-page">
            <div className="recipe-header">
                <div className="recipe-title-container">
                    <h1 className="recipe-title">{recipe.title}</h1>
                    
                    {/* Hiển thị nút chỉnh sửa và xóa nếu người xem là tác giả */}
                    {showAuthorActions && (
                      <div className="author-actions">
                        <button 
                          className="action-button edit"
                          onClick={() => navigate(`/edit-recipe/${id}`)}
                          title="Chỉnh sửa công thức"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        
                        <button 
                          className="action-button delete"
                          onClick={handleDeleteRecipe}
                          title="Xóa công thức"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                </div>
                
                {/* Thêm banner hiển thị trạng thái */}
                {recipe.status && recipe.status !== 'published' && (
                    <div className={`recipe-status-banner ${recipe.status}`}>
                        {recipe.status === 'pending_review' && 
                            'Công thức đang chờ duyệt. Hiện chỉ bạn mới xem được nội dung này.'}
                        {recipe.status === 'rejected' && 
                            'Công thức đã bị từ chối. Vui lòng liên hệ admin để biết thêm chi tiết.'}
                        {recipe.status === 'draft' && 
                            'Đây là bản nháp của công thức. Chỉ bạn mới nhìn thấy nó.'}
                    </div>
                )}
                
                <div className="recipe-meta">
                    <span className="recipe-author">
                        Đăng bởi: {recipe.author_name || 'Ẩn danh'}
                    </span>
                    <span className="recipe-date">
                        {new Date(recipe.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="recipe-time">
                        Thời gian nấu: {recipe.cooking_time} phút
                    </span>
                </div>
            </div>
            
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
            
            {recipe.thoughts && (
                <div className="recipe-thoughts">
                    <h2>Suy nghĩ của tác giả</h2>
                    <p>{recipe.thoughts}</p>
                </div>
            )}
            
            <div className="recipe-ingredients">
                <h2>Nguyên liệu</h2>
                <ul>
                    {recipe.ingredients && recipe.ingredients.map((ingredient, index) => (
                        <li key={index}>
                            <span className="ingredient-name">{ingredient.name}</span>: 
                            <span className="ingredient-quantity">{ingredient.quantity} {ingredient.unit}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="recipe-tabs">
                <button 
                    className={`tab-button ${activeTab === 'info' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('info')}
                >
                    Thông tin
                </button>
                <button 
                    className={`tab-button ${activeTab === 'procedure' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('procedure')}
                >
                    Hướng dẫn
                </button>
            </div>
            
            {/* Hiển thị nội dung theo tab */}
            {activeTab === 'info' && (
                <div className="recipe-info">
                    <h2>Thông tin công thức</h2>
                    <p><strong>Tác giả:</strong> {recipe.author_name || 'Ẩn danh'}</p>
                    <p><strong>Ngày đăng:</strong> {new Date(recipe.created_at).toLocaleDateString('vi-VN')}</p>
                    <p><strong>Thời gian chuẩn bị:</strong> {recipe.preparation_time || 0} phút</p>
                    <p><strong>Thời gian nấu:</strong> {recipe.cooking_time || 0} phút</p>
                    <p><strong>Tổng thời gian:</strong> {recipe.total_time || 0} phút</p>
                    <p><strong>Độ khó:</strong> {recipe.difficulty || 'Không xác định'}</p>
                    <p><strong>Danh mục:</strong> {recipe.category || 'Không xác định'}</p>
                    <p><strong>Thẻ:</strong> {recipe.tags && Array.isArray(recipe.tags) ? recipe.tags.join(', ') : 'Không có thẻ'}</p>
                </div>
            )}
            
            {/* Thêm một component Info để hiển thị thông tin về các bước chi tiết */}
            {activeTab === 'procedure' && (
              <div className="recipe-procedure">
                <h2>Hướng dẫn chi tiết</h2>
                <div className="info-message">
                  <i className="fas fa-info-circle"></i> Mỗi bước có thể đi kèm một hình ảnh minh họa để dễ hiểu hơn.
                </div>
                <ol className="steps-list">
                  {recipe.steps && recipe.steps.map((step, index) => (
                    <li key={index}>
                      <h3>Bước {index + 1}</h3>
                      <p>{step.description}</p>
                      
                      {/* Chỉ giữ lại phần hiển thị ảnh */}
                      {step.image_url && (
                          <div className="step-media">
                              <img 
                                  src={step.image_url.startsWith('http') 
                                      ? step.image_url 
                                      : `http://localhost:5000${step.image_url}`} 
                                  alt={`Hình ảnh bước ${index + 1}`}
                                  className="step-image"
                                  onError={(e) => {
                                      console.error(`Không thể tải ảnh bước ${index + 1}: ${step.image_url}`);
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                  }}
                              />
                          </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            
            <div className="recipe-actions">
                <button 
                    className={`action-button ${liked ? 'liked' : ''}`} 
                    onClick={handleLike}
                    style={{ color: liked ? 'red' : undefined }}
                >
                    <i className={`fa${liked ? 's' : 'r'} fa-heart`}></i>
                    {liked ? 'Đã thích' : 'Thích'} ({likesCount})
                </button>
                
                <button 
                    className={`action-button ${saved ? 'saved' : ''}`}
                    onClick={handleSave}
                    style={{ color: saved ? 'green' : undefined }}
                >
                    <i className={`fa${saved ? 's' : 'r'} fa-bookmark`}></i>
                    {saved ? 'Đã lưu' : 'Lưu'} ({savesCount})
                </button>
                
                <button 
                    className="action-button"
                    onClick={() => handleShare()}
                >
                    <i className="fas fa-share-alt"></i>
                    Chia sẻ ({sharesCount})
                </button>
                
                <button 
                    className="action-button"
                    onClick={() => handleDownloadPDF()}
                >
                    <i className="fas fa-file-pdf"></i>
                    Xuất PDF
                </button>
                
                {/* Thêm nút báo cáo nếu không phải là tác giả */}
                {!showAuthorActions && currentUser && recipe && recipe.id && (
                    <ReportButton 
                        type="recipe"
                        targetId={recipe.id}
                        targetName={recipe.title}
                    />
                )}
            </div>
            
            {/* Thêm component Comments */}
            <Comments recipeId={id} />
            
            {/* Thêm ChatbotButton ở dưới cùng */}
            {recipe && <ChatbotButton recipe={recipe} />}
        </div>
    );
};

export default RecipeDetailPage;