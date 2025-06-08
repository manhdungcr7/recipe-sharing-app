import api from './api';

// Lấy tất cả công thức
export const fetchRecipes = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`http://localhost:5000/api/recipes?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recipes');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
};

// Lấy chi tiết công thức theo ID
export const getRecipeById = async (id) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://localhost:5000/api/recipes/${id}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch recipe details');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching recipe with id ${id}:`, error);
    throw error;
  }
};

// Thêm công thức mới
export const addRecipe = async (recipeData) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('http://localhost:5000/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(recipeData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add recipe');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding recipe:', error);
    throw error;
  }
};

// Cập nhật công thức
export const updateRecipe = async (id, recipeData) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://localhost:5000/api/recipes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(recipeData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update recipe');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
};

// Xóa công thức
export const deleteRecipe = async (id) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://localhost:5000/api/recipes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete recipe');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
};

// Thích công thức
export const likeRecipe = async (id) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://localhost:5000/api/recipes/${id}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to like recipe');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error liking recipe:', error);
    throw error;
  }
};

// Lưu công thức
export const saveRecipe = async (id) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://localhost:5000/api/recipes/${id}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save recipe');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving recipe:', error);
    throw error;
  }
};

// Chia sẻ công thức
export const shareRecipe = async (id) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://localhost:5000/api/recipes/${id}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to share recipe');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sharing recipe:', error);
    throw error;
  }
};

// Tìm kiếm công thức nấu ăn - ưu tiên sử dụng API simple
export const searchRecipes = async (searchParams) => {
  try {
    const query = searchParams.query || '';
    
    // Luôn sử dụng API simple trước
    if (query) {
      try {
        console.log('Searching with simple API:', query);
        const simpleResponse = await fetch(`http://localhost:5000/api/search/simple?q=${encodeURIComponent(query)}`);
        
        if (simpleResponse.ok) {
          const data = await simpleResponse.json();
          console.log('Simple search result:', data);
          if (data.success) return data;
        }
      } catch (simpleError) {
        console.log('Simple search failed, trying regular search', simpleError);
      }
    }
    
    // Nếu simple API thất bại, thử regular API
    const params = new URLSearchParams();
    
    // Thêm các tham số tìm kiếm
    if (query) params.append('query', query);
    if (searchParams.category) params.append('category', searchParams.category);
    if (searchParams.ingredient) params.append('ingredient', searchParams.ingredient);
    if (searchParams.time) params.append('time', searchParams.time);
    if (searchParams.difficulty) params.append('difficulty', searchParams.difficulty);
    
    const url = `http://localhost:5000/api/search/recipes?${params.toString()}`;
    console.log('Falling back to regular search URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Search API error response:', errorText);
      throw new Error('Không thể tìm kiếm công thức');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching recipes:', error);
    throw error;
  }
};

// Xuất bản công thức (admin only)
export const publishRecipe = async (id) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://localhost:5000/api/admin/recipes/${id}/publish`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to publish recipe');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error publishing recipe:', error);
    throw error;
  }
};