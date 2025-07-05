/**
 * Lấy token xác thực từ localStorage (kiểm tra cả hai key)
 */
export const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
};

/**
 * Lưu token xác thực vào localStorage (cả hai key để đảm bảo tương thích)
 */
export const setAuthToken = (token: string): void => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('token', token); // Cho tương thích ngược
};

/**
 * Lấy thông tin user từ localStorage
 */
export const getUser = (): any | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
        const userData = JSON.parse(userStr);
        // Nếu user là chuỗi JWT (token) thì trả về null
        if (typeof userData === 'string') {
            console.error("User data in localStorage is a string, not an object");
            return null;
        }
        return userData;
    } catch (err) {
        console.error("Error parsing user data:", err);
        return null;
    }
};

/**
 * Lưu thông tin user vào localStorage
 */
export const setUser = (userData: any): void => {
    localStorage.setItem('user', JSON.stringify(userData));
};

/**
 * Xóa thông tin đăng nhập khỏi localStorage
 */
export const clearAuth = (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};