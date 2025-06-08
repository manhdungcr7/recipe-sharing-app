// Lấy bình luận cho công thức
export const getRecipeComments = async (recipeId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/comments/recipe/${recipeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// Lấy phản hồi của bình luận
export const getCommentReplies = async (commentId, page = 1, limit = 10) => {
    try {
        const response = await fetch(`http://localhost:5000/api/comments/${commentId}/replies?page=${page}&limit=${limit}`);
        if (!response.ok) {
            throw new Error('Failed to fetch comment replies');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching comment replies:', error);
        throw new Error('Error fetching comment replies: ' + error.message);
    }
};

// Tạo bình luận mới
export const createComment = async ({ recipeId, text, imageFile = null }) => {
  try {
    const token = localStorage.getItem('auth_token');
    
    // Nếu có hình ảnh, sử dụng FormData
    if (imageFile) {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('image', imageFile);
      
      const response = await fetch(`http://localhost:5000/api/comments/recipe/${recipeId}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post comment');
      }
      
      const data = await response.json();
      return data;
    } 
    // Không có hình ảnh, sử dụng JSON
    else {
      const response = await fetch(`http://localhost:5000/api/comments/recipe/${recipeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post comment');
      }
      
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// Xóa bình luận
export const deleteComment = async (commentId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete comment');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Phản hồi bình luận
export const replyToComment = async (commentId, text) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://localhost:5000/api/comments/${commentId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reply to comment');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error replying to comment:', error);
    throw error;
  }
};