import axios from 'axios';

const API_URL = '/api/notifications';

// Function to fetch notifications for a user
export const fetchNotifications = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

// Function to mark a notification as read
export const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await axios.put(`${API_URL}/read/${notificationId}`);
        return response.data;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

// Function to delete a notification
export const deleteNotification = async (notificationId) => {
    try {
        const response = await axios.delete(`${API_URL}/${notificationId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};