import api from './api';

export const getReports = async () => {
    try {
        const response = await api.get('/admin/reports');
        return response.data;
    } catch (error) {
        throw new Error('Error fetching reports: ' + error.message);
    }
};

export const deleteReport = async (reportId) => {
    try {
        const response = await api.delete(`/admin/reports/${reportId}`);
        return response.data;
    } catch (error) {
        throw new Error('Error deleting report: ' + error.message);
    }
};

export const moderateContent = async (contentId, action) => {
    try {
        const response = await api.post(`/admin/moderate`, { contentId, action });
        return response.data;
    } catch (error) {
        throw new Error('Error moderating content: ' + error.message);
    }
};

export const manageUser = async (userId, action) => {
    try {
        const response = await api.post(`/admin/users/${userId}`, { action });
        return response.data;
    } catch (error) {
        throw new Error('Error managing user: ' + error.message);
    }
};