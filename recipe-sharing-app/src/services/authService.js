const authService = {
    // Đăng nhập
    login: async (email, password) => {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // THAY ĐỔI TẠI ĐÂY: Dùng auth_token thay vì token
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } else {
            throw new Error(data.message || 'Đăng nhập không thành công');
        }
    },

    // Đăng xuất
    logout: () => {
        // THAY ĐỔI TẠI ĐÂY: Xóa auth_token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token'); // giữ để xóa token cũ nếu có
        localStorage.removeItem('user');
    },

    // Kiểm tra nếu đã đăng nhập
    isAuthenticated: () => {
        // THAY ĐỔI TẠI ĐÂY: Kiểm tra auth_token
        return !!localStorage.getItem('auth_token');
    },

    // Lấy thông tin người dùng từ localStorage
    getUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    },

    // Kiểm tra nếu là admin
    isAdmin: () => {
        const user = authService.getUser();
        return user && user.role === 'admin';
    }
};

// VÍ DỤ: Trong fetch interceptor hoặc các service khác
const token = localStorage.getItem('auth_token');  // Thay vì 'token'
if (token) {
  headers.Authorization = `Bearer ${token}`;
}

export default authService;