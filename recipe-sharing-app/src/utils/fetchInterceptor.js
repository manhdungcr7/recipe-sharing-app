// Thêm một biến để theo dõi port
let apiPort = 5000; // Port mặc định
let apiPortChecked = false;

// Hàm kiểm tra port khả dụng
const checkApiPort = async () => {
  if (apiPortChecked) return apiPort;
  
  const ports = [5000, 5001, 5002, 5003, 8080, 8000];
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/api/status`, {
        method: 'GET',
        timeout: 1000
      });
      
      if (response.ok) {
        console.log(`API available at port ${port}`);
        apiPort = port;
        apiPortChecked = true;
        return port;
      }
    } catch (error) {
      console.log(`Port ${port} unavailable or error:`, error.message);
    }
  }
  
  console.error('Could not find a working API port');
  return 5000; // Fallback to default
};

// Cập nhật hàm xử lý lỗi
const setupFetchInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (url, options = {}) => {
    // Nếu là request API gửi đến backend
    if (url.includes('/api/')) {
      const token = localStorage.getItem('auth_token'); // Thống nhất dùng auth_token
      
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }
    
    return originalFetch(url, options);
  };
};

export default setupFetchInterceptor;