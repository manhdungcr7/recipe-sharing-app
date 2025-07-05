import React, { useState, useEffect } from 'react';
import './RecipeCard.css';
import { formatDate } from '../../utils/helpers';
import { getRecipeImageUrl } from '../../utils/imageUtils';

const RecipeCard = ({ recipe, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Thay hàm getImageUrl() hiện tại
  const getImageUrl = () => {
    return getRecipeImageUrl(recipe.image_url);
  };

  // Kiểm tra xem recipe có ảnh không
  const hasImage = !!recipe.image_url;
  
  // Lấy URL ảnh
  const imageUrl = getImageUrl();

  // Tạo màu nền ngẫu nhiên nhưng ổn định cho placeholder
  const getBackgroundColor = () => {
    const seed = recipe.id || 0;
    const hue = (seed * 137.5) % 360;
    return `hsl(${hue}, 70%, 80%)`;
  };

  // Preload hình ảnh
  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = (e) => {
        console.error(`Failed to preload image for recipe ${recipe.id} (${recipe.title}):`, imageUrl);
        setImageError(true);
      };
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
    }
  }, [recipe.id, imageUrl, recipe.title]);

  console.log('Recipe:', recipe.title, recipe.image_url); // Log thông tin công thức

  return (
    <div 
      className={`recipe-card ${recipe.status === 'draft' ? 'draft-recipe' : ''}`} 
      onClick={onClick}
    >
      {recipe.status === 'draft' && (
        <div className="draft-badge">
          <i className="fas fa-pencil-alt"></i> Bản nháp
        </div>
      )}
      
      <div className="recipe-image-container">
        {hasImage && !imageError ? (
          <img
            src={imageUrl}
            alt={recipe.title}
            crossOrigin="anonymous"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.error(`Image load error for recipe ${recipe.id} (${recipe.title}):`, imageUrl);
              setImageError(true);
            }}
            style={{
              display: imageLoaded ? 'block' : 'none'
            }}
          />
        ) : null}
        
        {(!imageLoaded || imageError) && (
          <div 
            className="recipe-image-placeholder"
            style={{ 
              backgroundColor: getBackgroundColor(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              fontSize: '2rem',
              color: 'white'
            }}
          >
            <span className="placeholder-text">{recipe.title.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="recipe-info">
        <h3 className="recipe-title">{recipe.title}</h3>
        <div className="recipe-meta">
          <span className="recipe-author">{recipe.author_name || 'Ẩn danh'}</span>
          <span className="recipe-date">{formatDate(recipe.created_at)}</span>
          {recipe.status === 'published' && recipe.likes_count !== undefined && (
            <span className="recipe-likes">
              <i className="far fa-heart"></i> {recipe.likes_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;