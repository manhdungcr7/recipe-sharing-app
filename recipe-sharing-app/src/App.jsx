import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { RecipeProvider } from './context/RecipeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import setupFetchInterceptor from './utils/fetchInterceptor';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CreateRecipePage from './pages/CreateRecipePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ProfilePage from './pages/ProfilePage';
import EditRecipePage from './pages/EditRecipePage'; // THÊM DÒNG NÀY
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminRecipesPage from './pages/AdminRecipesPage';
import NotFoundPage from './pages/NotFoundPage';
import LandingPage from './pages/LandingPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportUserPage from './pages/ReportUserPage'; // Thêm dòng import này
import DashboardPage from './pages/DashboardPage'; // Import DashboardPage
import UserProfilePage from './pages/UserProfilePage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Styles
import './App.css';

// Protected Route Component để yêu cầu đăng nhập
const ProtectedRoute = ({ children, requiredAuth, requiredAdmin = false }) => {
    const { isAuthenticated, currentUser, loading } = React.useContext(AuthContext);
    
    if (loading) {
        return <div>Đang tải...</div>;
    }
    
    if (requiredAuth && !isAuthenticated) {
        return <Navigate to="/login" />;
    }
    
    if (requiredAdmin && (!isAuthenticated || currentUser?.role !== 'admin')) {
        return <Navigate to="/" />;
    }
    
    return <>{children}</>;
};

const App = () => {
  // Thiết lập fetch interceptor và kiểm tra/xử lý token không hợp lệ
  useEffect(() => {
    setupFetchInterceptor();
  }, []);

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || "202449099306-kkaij5aksnet6l64aahh5ia9o1gb25vk.apps.googleusercontent.com"}>
      <AuthProvider>
        <RecipeProvider>
          <Router>
            <Routes>
              {/* Landing Page (public) */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Đăng nhập xong trở về trang chủ */}
              <Route path="/home" element={
                <ProtectedRoute requiredAuth={true}>
                  <MainLayout>
                    <HomePage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Dashboard sau khi đăng nhập */}
              <Route path="/dashboard" element={
                <ProtectedRoute requiredAuth={true}>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Thêm đường dẫn để chỉnh sửa công thức */}
              <Route path="/edit-recipe/:id" element={
                <ProtectedRoute requiredAuth={true}>
                  <MainLayout>
                    <EditRecipePage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Các route khác */}
              <Route path="/create-recipe" element={
                <ProtectedRoute requiredAuth={true}>
                  <MainLayout>
                    <CreateRecipePage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/recipe/:id" element={
                <MainLayout>
                  <RecipeDetailPage />
                </MainLayout>
              } />
              
              <Route path="/search" element={
                <MainLayout>
                  <SearchResultsPage />
                </MainLayout>
              } />
              
              <Route path="/profile/:userId" element={
                <MainLayout>
                  <UserProfilePage />
                </MainLayout>
              } />
              
              {/* Thêm route cho trang thông báo */}
              <Route path="/notifications" element={
                <ProtectedRoute requiredAuth={true}>
                  <MainLayout>
                    <NotificationsPage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Thêm route cho trang báo cáo người dùng */}
              <Route path="/report/user/:id" element={
                <ProtectedRoute requiredAuth={true}>
                  <MainLayout>
                    <ReportUserPage />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredAuth={true} requiredAdmin={true}>
                  <AdminLayout>
                    <AdminDashboardPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/users" element={
                <ProtectedRoute requiredAuth={true} requiredAdmin={true}>
                  <AdminLayout>
                    <AdminUsersPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/recipes" element={
                <ProtectedRoute requiredAuth={true} requiredAdmin={true}>
                  <AdminLayout>
                    <AdminRecipesPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/categories" element={
                <ProtectedRoute requiredAuth={true} requiredAdmin={true}>
                  <AdminLayout>
                    <AdminCategoriesPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/reports" element={
                <ProtectedRoute requiredAuth={true} requiredAdmin={true}>
                  <AdminLayout>
                    <AdminReportsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/settings" element={
                <ProtectedRoute requiredAuth={true} requiredAdmin={true}>
                  <AdminLayout>
                    <AdminSettingsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </RecipeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;