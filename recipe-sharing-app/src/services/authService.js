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
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } else {
            throw new Error(data.message || 'Đăng nhập không thành công');
        }
    },

    // Đăng xuất
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Kiểm tra nếu đã đăng nhập
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
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

export default authService;