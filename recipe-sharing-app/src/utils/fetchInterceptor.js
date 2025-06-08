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
  
  window.fetch = async function(url, options = {}) {
    // Thêm try-catch bao quanh toàn bộ hàm
    try {
      // Đảm bảo URL là chuẩn khi gọi API
      if (url.includes('/api/') && !url.includes('http')) {
        url = `http://localhost:5000${url}`;
      }
      
      // Nếu là request API, thêm token vào header
      if (url.includes('/api/')) {
        const token = localStorage.getItem('token');
        
        if (token) {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
          };
        }
      }
      
      try {
        const response = await originalFetch(url, options);
        
        // Kiểm tra response
        if (response.status === 401) {
          console.warn('Authentication failed. Logging out...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Chuyển hướng đến trang đăng nhập nếu không phải đang ở đó
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        
        return response;
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        // Log thông tin chi tiết
        console.log('URL attempted:', url);
        console.log('Options:', JSON.stringify(options));
        throw fetchError;
      }
    } catch (error) {
      console.error('Fetch interceptor error:', error);
      throw error;
    }
  };
};

export default setupFetchInterceptor;