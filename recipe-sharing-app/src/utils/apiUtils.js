// Tạo file utility để xử lý API requests
export const getAuthToken = () => {
  const token = localStorage.getItem('token');
  
  // Kiểm tra token có giá trị và đúng định dạng không
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }
  
  // Kiểm tra thêm xem có cấu trúc đúng của JWT không (có 3 phần)
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error("Invalid token format in localStorage");
    localStorage.removeItem('token'); // Xóa token không hợp lệ
    return null;
  }
  
  return token;
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const apiRequest = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  const response = await fetch(`http://localhost:5000${url}`, {
    ...options,
    headers
  });
  
  if (response.status === 401) {
    // Token hết hạn hoặc không hợp lệ
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Lưu đường dẫn hiện tại để quay lại sau khi đăng nhập
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    
    // Chuyển hướng đến trang đăng nhập
    window.location.href = '/login';
    throw new Error('Token hết hạn. Vui lòng đăng nhập lại.');
  }
  
  return response;
};