import React, { createContext, useState, useEffect } from 'react';

// Create the context
export const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  // Define state variables for authentication
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error('Error parsing user data:', err);
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Lấy giá trị auth_token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    // Lấy giá trị user
    const userStr = localStorage.getItem('user');
    // Chỉ coi là đã đăng nhập khi CẢ HAI đều tồn tại
    return !!(token && userStr);
  });
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        // Kiểm tra token trong localStorage
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          setIsAuthenticated(false);
          setCurrentUser(null);
          return;
        }
        
        // QUAN TRỌNG: Lấy thông tin người dùng từ localStorage trước
        let storedUserData = null;
        try {
          const storedUserString = localStorage.getItem('user');
          if (storedUserString) {
            storedUserData = JSON.parse(storedUserString);
          }
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
        
        // Gọi API kiểm tra token
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // QUAN TRỌNG: So sánh và giữ lại tên người dùng đã chỉnh sửa
            if (storedUserData && storedUserData.id === data.data.id && storedUserData.name !== data.data.name) {
              console.log("Restoring custom name after auth check");
              data.data.name = storedUserData.name;
            }
            
            localStorage.setItem('user', JSON.stringify(data.data));
            setCurrentUser(data.data);
            setIsAuthenticated(true);
          } else {
            // Không có dữ liệu hoặc không thành công
            localStorage.removeItem('auth_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // Response không OK
          localStorage.removeItem('auth_token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Verify authentication with backend
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (!isAuthenticated) return; // Không cần kiểm tra nếu chưa đăng nhập
        
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) return;

        // Gọi API xác thực
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          // Token không hợp lệ, đăng xuất
          localStorage.removeItem('auth_token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setCurrentUser(null);
          setIsAuthenticated(false);
        } else {
          // Token hợp lệ, cập nhật user data nếu cần
          const data = await response.json();
          if (data.success && data.data) {
            setCurrentUser(data.data);
            localStorage.setItem('user', JSON.stringify(data.data));
          }
        }
      } catch (err) {
        console.error('Error verifying auth:', err);
      }
    };

    verifyAuth();
  }, [isAuthenticated]);

  // Login function
  const login = (userData, token) => {
    try {
      // Lưu token vào localStorage
      localStorage.setItem('auth_token', token);
      
      // QUAN TRỌNG: Kiểm tra xem đã có thông tin người dùng trong localStorage chưa
      const existingUserString = localStorage.getItem('user');
      if (existingUserString) {
        try {
          const existingUser = JSON.parse(existingUserString);
          
          // Nếu cùng một người dùng và tên đã được chỉnh sửa, giữ lại tên đã chỉnh sửa
          if (existingUser && existingUser.id === userData.id && existingUser.name) {
            console.log("Preserving custom name:", existingUser.name);
            userData = {...userData, name: existingUser.name};
          }
        } catch (error) {
          console.error("Error parsing localStorage user:", error);
        }
      }
      
      // Cập nhật localStorage và state với thông tin đã kết hợp
      localStorage.setItem('user', JSON.stringify(userData));
      setCurrentUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Google login function
  const loginWithGoogle = async (tokenId) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tokenId })
      });

      if (!response.ok) {
        throw new Error(`Login failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Save token with the consistent key
      
      // Update state
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      
      return data.user;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  // Update user avatar
  const updateAvatar = (avatarUrl) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        picture: avatarUrl
      });
    }
  };

  // Thêm vào các hàm được export
  const clearAuth = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        setCurrentUser, 
        isAuthenticated, 
        login, 
        logout,
        clearAuth, // Thêm clearAuth vào đây
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};