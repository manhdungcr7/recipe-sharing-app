import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import CreateRecipePage from './pages/CreateRecipePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminPage from './pages/AdminPage';
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                {/* Login route ở ngoài layouts */}
                <Route path="/login" element={<LoginPage />} />

                {/* Main Layout routes */}
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<SearchResultsPage />} />
                    <Route path="/create-recipe" element={<CreateRecipePage />} />
                    <Route path="/recipe/:id" element={<RecipeDetailPage />} />
                    <Route path="/user/:username" element={<UserProfilePage />} />
                </Route>

                {/* Admin Layout routes */}
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminPage />} />
                </Route>

                {/* Redirect route */}
                <Route path="/create" element={<Navigate to="/create-recipe" />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;