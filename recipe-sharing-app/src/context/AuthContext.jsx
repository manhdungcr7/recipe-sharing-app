import React, { createContext, useState, useEffect } from 'react';

// Create the context
export const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  // Define state variables for authentication
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        // Use consistent token key - 'token' instead of 'auth_token'
        const token = localStorage.getItem('token');
        if (token) {
          // Fetch user data from API
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData.data);
            setIsAuthenticated(true);
          } else {
            // If token is invalid, clear it
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (token, userData) => {
    // Save token with the consistent key
    localStorage.setItem('token', token);
    
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    setCurrentUser(userData);
    setIsAuthenticated(true);
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
      localStorage.setItem('token', data.token);
      
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

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        isAuthenticated, 
        loading,
        login, 
        logout, 
        loginWithGoogle,
        updateAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};