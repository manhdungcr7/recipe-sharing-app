/**
 * Cấu hình API URLs và endpoints
 */

// Base URL cho tất cả các API requests
const API_BASE_URL = 'http://localhost:5000/api';

// Các endpoints cụ thể
const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    google: '/auth/google',
    me: '/auth/me',
    checkToken: '/auth/check-token',
    time: '/auth/time'
  },
  recipes: {
    list: '/recipes',
    create: '/recipes',
    detail: (id) => `/recipes/${id}`,
    update: (id) => `/recipes/${id}`,
    delete: (id) => `/recipes/${id}`,
    featured: '/recipes/featured',
    saved: '/recipes/saved',
    drafts: '/recipes/drafts',
    userRecipes: (userId) => `/user/recipes/${userId}`,
  },
  search: {
    query: '/search',
    popular: '/search/popular',
    suggestions: '/search/suggestions',
  },
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    markAsRead: (id) => `/notifications/${id}/read`,
    markAllAsRead: '/notifications/markAllRead',
  },
  debug: {
    routes: '/routes',
  }
};

export {
  API_BASE_URL,
  ENDPOINTS
};
