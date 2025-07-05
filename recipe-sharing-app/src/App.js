import React, { useState, useContext, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { AuthContext, AuthProvider } from './context/AuthContext';
import './App.css';
import CreateRecipePage from './pages/CreateRecipePage';
import OtherProfilePage from './pages/OtherProfilePage';
import ReportUserPage from './pages/ReportUserPage';
import EditRecipePage from './pages/EditRecipePage';

// Placeholder components for each page
const LoginPage = () => {
  const navigate = useNavigate();
  
  const handleGoogleLogin = () => {
    // In a real app, this would trigger Google OAuth
    // For now, we'll just simulate a successful login and redirect
    console.log("Google login clicked");
    navigate('/');
  };

  return (
    <div className="page login-page">
      <h1>Login Page</h1>
      <div className="login-container">
        <button className="google-login-btn" onClick={handleGoogleLogin}>
          Login with Google
        </button>
      </div>
    </div>
  );
};

// Fix the HomePage component
const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { currentUser, logout } = useContext(AuthContext);
  
  const handleCreateRecipe = () => {
    navigate('/create');
  };
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="page home-page">
      <h1>Personal Profile</h1>
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Search recipes or users..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      
      <div className="profile-section">
        <div className="profile-header">
          <div className="profile-avatar">
            {currentUser?.picture ? (
              <img src={currentUser.picture} alt="Profile" className="avatar-img" />
            ) : (
              <div className="placeholder-avatar">Avatar</div>
            )}
          </div>
          <div className="profile-info">
            <h2>{currentUser?.name || "User Name"}</h2>
            <p className="user-email">{currentUser?.email || "email@example.com"}</p>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
      
      <div className="profile-stats">
        <div className="stat">Followers: 0</div>
        <div className="stat">Following: 0</div>
        <div className="stat">Posts: 0</div>
      </div>
      
      <div className="action-buttons">
        <button className="create-post-btn" onClick={handleCreateRecipe}>Create New Recipe</button>
      </div>
      
      <div className="posts-container">
        <h2>Your Recipes</h2>
        <p>No recipes yet. Create your first recipe!</p>
      </div>
    </div>
  );
};

const SearchResultsPage = () => (
  <div className="page search-results-page">
    <h1>Search Results</h1>
    <div className="search-bar">
      <input type="text" placeholder="Search recipes or users..." />
      <button>Search</button>
    </div>
    <div className="filters">
      <button>Recipes</button>
      <button>Users</button>
      <button>Ingredients</button>
      <button>Cooking Methods</button>
    </div>
    <div className="results-container">
      <p>No results found.</p>
    </div>
  </div>
);

const CreatePostPage = () => (
  <div className="page create-post-page">
    <h1>Create New Recipe</h1>
    <form className="recipe-form">
      <div className="form-group">
        <label>Recipe Name*</label>
        <input type="text" required />
      </div>
      <div className="form-group">
        <label>Upload Image</label>
        <input type="file" accept="image/*" />
      </div>
      <div className="form-group">
        <label>Ingredients*</label>
        <textarea placeholder="Enter ingredients with measurements" required></textarea>
      </div>
      <div className="form-group">
        <label>Cooking Time*</label>
        <input type="number" min="1" placeholder="Minutes" required />
      </div>
      <div className="form-group">
        <label>Cooking Steps*</label>
        <textarea placeholder="Describe the steps to prepare this recipe" required></textarea>
      </div>
      <div className="form-group">
        <label>Your Thoughts</label>
        <textarea placeholder="Share your thoughts about this recipe"></textarea>
      </div>
      <div className="form-actions">
        <button type="button">Save as Draft</button>
        <button type="submit">Publish</button>
      </div>
    </form>
  </div>
);

const RecipeDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const handleChatbotClick = () => {
    navigate(`/chatbot/${id}`);
  };
  return (
    <div className="page recipe-detail-page">
      <h1>Recipe Details</h1>
      <div className="recipe-header">
        <h2>Recipe Name</h2>
        <div className="recipe-meta">
          <span>By: User</span>
          <span>Cooking Time: 0 mins</span>
        </div>
      </div>
      <div className="recipe-image">
        <div className="placeholder-image">Recipe Image</div>
      </div>
      <div className="recipe-ingredients">
        <h3>Ingredients</h3>
        <p>No ingredients listed.</p>
      </div>
      <div className="recipe-steps">
        <h3>Instructions</h3>
        <p>No instructions provided.</p>
      </div>
      <div className="recipe-actions">
        <button>Like</button>
        <button>Save</button>
        <button>Share</button>
        <button>Export as PDF</button>
        <button className="chatbot-btn">Ask Chatbot</button>
      </div>
      <div className="recipe-comments">
        <h3>Comments</h3>
        <div className="comment-form">
          <textarea placeholder="Add a comment..."></textarea>
          <button>Post</button>
        </div>
        <div className="comments-list">
          <p>No comments yet.</p>
        </div>
      </div>
    </div>
  );
};

const ChatbotPage = () => (
  <div className="page chatbot-page">
    <h1>Recipe Assistant Chatbot</h1>
    <div className="chat-container">
      <div className="chat-messages">
        <div className="message bot">
          Hello! I'm your recipe assistant. Ask me anything about this recipe!
        </div>
      </div>
      <div className="chat-input">
        <input type="text" placeholder="Type your question..." />
        <button>Send</button>
      </div>
    </div>
  </div>
);

const UserProfilePage = () => (
  <div className="page user-profile-page">
    <h1>User Profile</h1>
    <div className="profile-header">
      <div className="profile-avatar">
        <div className="placeholder-avatar">User Avatar</div>
      </div>
      <div className="profile-info">
        <h2>User Name</h2>
        <div className="profile-stats">
          <div className="stat">Followers: 0</div>
          <div className="stat">Following: 0</div>
          <div className="stat">Posts: 0</div>
        </div>
        <button className="follow-btn">Follow</button>
      </div>
    </div>
    <div className="user-recipes">
      <h3>Recipes</h3>
      <div className="recipes-grid">
        <p>No recipes published yet.</p>
      </div>
    </div>
  </div>
);

const AdminPage = () => (
  <div className="page admin-page">
    <h1>Admin Dashboard</h1>
    <div className="admin-sections">
      <div className="reports-section">
        <h2>User Reports</h2>
        <p>No pending reports.</p>
      </div>
      <div className="content-moderation">
        <h2>Content Moderation</h2>
        <p>No content waiting for review.</p>
      </div>
      <div className="user-management">
        <h2>User Management</h2>
        <div className="user-search">
          <input type="text" placeholder="Search users..." />
          <button>Search</button>
        </div>
        <p>No users found.</p>
      </div>
    </div>
  </div>
);

const LoginPageWrapper = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Gọi API đăng nhập
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Lưu token và user vào localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Cập nhật context
        login(data.user, data.token); // cập nhật context ngay lập tức
        navigate('/admin/dashboard');
      } else {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="page login-page">
      <h1>Đăng nhập</h1>
      {error && <p className="error-message">{error}</p>}
      
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
        
        <div className="auth-links">
          Chưa có tài khoản? <a href="/register">Đăng ký</a>
        </div>
      </div>
    </div>
  );
};

// Thêm trang RegisterPage
const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        navigate('/login');
      } else {
        throw new Error(data.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="page register-page">
      <h1>Đăng ký tài khoản</h1>
      {error && <p className="error-message">{error}</p>}
      
      <div className="register-container">
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Họ tên</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>
        
        <div className="auth-links">
          Đã có tài khoản? <a href="/login">Đăng nhập</a>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);

  // Check authentication status on mount and when currentUser changes
  useEffect(() => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPageWrapper setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/register" element={<RegisterPage />} /> {/* Thêm route đăng ký */}
            <Route path="/" element={isLoggedIn ? <HomePage /> : <Navigate to="/login" />} />
            <Route path="/search" element={isLoggedIn ? <SearchResultsPage /> : <Navigate to="/login" />} />
            <Route path="/create-recipe" element={isLoggedIn ? <CreatePostPage /> : <Navigate to="/login" />} />
            <Route path="/create" element={<Navigate to="/create-recipe" />} />
            <Route path="/recipe/:id" element={isLoggedIn ? <RecipeDetailPage /> : <Navigate to="/login" />} />
            <Route path="/chatbot/:recipeId" element={isLoggedIn ? <ChatbotPage /> : <Navigate to="/login" />} />
            
            {/* Các route mới cho dashboard và profile người dùng khác */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <HomePage />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/profile/:id" 
              element={
                <MainLayout>
                  <OtherProfilePage />
                </MainLayout>
              } 
            />
            
            <Route path="/admin" element={isLoggedIn && isAdmin ? <AdminPage /> : <Navigate to="/login" />} />
            
            {/* Route báo cáo người dùng */}
            <Route 
              path="/report/user/:id" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <ReportUserPage />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
            
            <Route path="/edit-recipe/:id" element={<EditRecipePage />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;