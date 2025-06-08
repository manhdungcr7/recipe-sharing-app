import api from './api';

// Lấy thông tin người dùng
export const getUserProfile = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching user profile: ' + error.message);
    }
};

// Lấy công thức của người dùng
export const getUserRecipes = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}/recipes`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching user recipes: ' + error.message);
    }
};

// Cập nhật thông tin người dùng
export const updateUserProfile = async (userId, userData) => {
    try {
        const response = await api.put(`/users/${userId}`, userData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw new Error('Error updating profile: ' + error.message);
    }
};

// Follow/Unfollow người dùng
export const followUser = async (userId) => {
    try {
        const response = await api.post(`/users/${userId}/follow`);
        return response.data;
    } catch (error) {
        throw new Error('Error following user: ' + error.message);
    }
};

// Lấy danh sách followers
export const getUserFollowers = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}/followers`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching followers: ' + error.message);
    }
};

// Lấy danh sách following
export const getUserFollowing = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}/following`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching following: ' + error.message);
    }
};

// Lấy danh sách công thức đã lưu
export const getSavedRecipes = async () => {
    try {
        const response = await api.get('/users/me/saved');
        return response.data;
    } catch (error) {
        throw new Error('Error fetching saved recipes: ' + error.message);
    }
};

// Gửi báo cáo vi phạm
export const reportUser = async (userId, reason, details) => {
    try {
        const response = await api.post(`/users/${userId}/report`, { reason, details });
        return response.data;
    } catch (error) {
        throw new Error('Error reporting user: ' + error.message);
    }
};

// Tìm kiếm người dùng
export const searchUsers = async (query) => {
  try {
    const token = localStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const response = await fetch(`http://localhost:5000/api/search/users?query=${encodeURIComponent(query)}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error('Không thể tìm kiếm người dùng');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};