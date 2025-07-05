import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const UserPosts = ({ userId }) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserRecipes = async () => {
            if (!userId) {
                console.log("UserPosts: No userId provided, skipping API call");
                setLoading(false);
                return;
            }

            console.log("Fetching recipes for user", userId);
            
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                
                const response = await fetch(`http://localhost:5000/api/users/${userId}/recipes`, { headers });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Recipes fetched successfully:", data);
                    setRecipes(data.data || []);
                } else {
                    console.error("Failed to fetch recipes:", response.status);
                    setError('Không thể tải danh sách công thức');
                }
            } catch (err) {
                console.error("Error fetching recipes:", err);
                setError('Lỗi kết nối đến server');
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserRecipes();
    }, [userId]);
    
    if (!userId) {
        return <div className="no-user-id">Không có ID người dùng để hiển thị công thức</div>;
    }
    
    if (loading) return <div className="loading">Đang tải công thức...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!recipes.length) return <div className="no-recipes">Chưa có công thức nào</div>;

    return (
        <div className="user-recipes">
            <h2>Công thức của người dùng</h2>
            <div className="recipes-grid">
                {recipes.map(recipe => (
                    <div key={recipe.id} className="recipe-card">
                        <Link to={`/recipe/${recipe.id}`}>
                            <div className="recipe-image-container">
                                <img 
                                    src={recipe.image_url 
                                        ? (recipe.image_url.startsWith('http') 
                                            ? recipe.image_url 
                                            : `http://localhost:5000${recipe.image_url}`)
                                        : "/default-recipe.jpg"} 
                                    alt={recipe.title}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/default-recipe.jpg";
                                    }}
                                />
                            </div>
                            <div className="recipe-info">
                                <h3>{recipe.title}</h3>
                                <p>{recipe.description}</p>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Thêm hàm tạo màu nền (có thể copy từ RecipeCard.jsx)
function getBackgroundColor(title) {
  // Ví dụ: hash màu từ tên món ăn
  const colors = ['#a3a1fb', '#6ddccf', '#f7b267', '#f4845f', '#f27059', '#355c7d', '#6c5b7b', '#c06c84'];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default UserPosts;