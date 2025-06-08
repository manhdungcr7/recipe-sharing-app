import React, { createContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/authService';
import { jwtDecode } from "jwt-decode";

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
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Kiểm tra trạng thái đăng nhập khi component mount
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                const token = localStorage.getItem('auth_token');
                
                if (token && storedUser) {
                    setCurrentUser(JSON.parse(storedUser));
                    setIsAuthenticated(true);
                }
            } catch (err) {
                console.error("Auth check error:", err);
            } finally {
                setLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    // Đăng nhập thông thường
    const login = (user: User, token: string) => {
        // Xóa cache cũ trước khi lưu thông tin mới
        localStorage.removeItem('profile_data_timestamp');
        
        // Lưu thông tin đăng nhập mới
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setCurrentUser(user);
        setIsAuthenticated(true);
    };

    // Đăng xuất
    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setCurrentUser(null);
        setIsAuthenticated(false);
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