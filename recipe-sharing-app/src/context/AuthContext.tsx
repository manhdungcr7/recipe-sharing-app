import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getAuthToken, setAuthToken, getUser, setUser, clearAuth } from '../utils/authHelper';

// Định nghĩa interface cho User
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  picture?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
    // Đảm bảo khởi tạo state đúng
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(() => {
      const user = localStorage.getItem('user');
      try {
        return user ? JSON.parse(user) : null;
      } catch {
        // Nếu parse lỗi, xóa user khỏi localStorage và trả về null
        localStorage.removeItem('user');
        return null;
      }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Kiểm tra trạng thái đăng nhập khi component mount
    useEffect(() => {
        const checkLoggedIn = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    // Không có token, đảm bảo logout
                    setIsAuthenticated(false);
                    setCurrentUser(null);
                    setLoading(false);
                    return;
                }
                
                // Kiểm tra token có hợp lệ không
                const response = await fetch('http://localhost:5000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        // Cập nhật user và trạng thái
                        setCurrentUser(data.data);
                        setIsAuthenticated(true);
                    } else {
                        // API trả về lỗi, xóa localStorage
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setCurrentUser(null);
                        setIsAuthenticated(false);
                    }
                } else {
                    // API trả về lỗi, xóa localStorage
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setCurrentUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Error checking login status:', error);
                setCurrentUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        
        checkLoggedIn();
    }, []);

    // Hàm đăng nhập
    const login = (userData: User, token: string) => {
      if (userData && typeof userData === 'object') {
        // Lưu vào localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Cập nhật state
        setCurrentUser(userData);
        setIsAuthenticated(true);
      } else {
        console.error("Invalid user data in login:", userData);
      }
    };

    // Hàm đăng xuất
    const logout = () => {
      // Xóa TẤT CẢ dữ liệu trong localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('redirectAfterLogin');
      
      // Đặt state về null/false
      setCurrentUser(null);
      setIsAuthenticated(false);
      
      // Chuyển hướng tới trang login (đã sửa, bỏ query param)
      window.location.href = '/login';
    };

    const value = {
        currentUser,
        loading,
        error,
        isAuthenticated,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};