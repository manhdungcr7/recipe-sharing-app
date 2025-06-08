import axios from 'axios';
import api from './api';

const API_URL = '/api/chatbot';

export const sendMessageToChatbot = async (message) => {
    try {
        const response = await axios.post(`${API_URL}/send`, { message });
        return response.data;
    } catch (error) {
        console.error('Error sending message to chatbot:', error);
        throw error;
    }
};

export const getChatbotResponse = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/response/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching chatbot response:', error);
        throw error;
    }
};

// Gửi câu hỏi tới chatbot
export const askChatbot = async (recipeId, question) => {
    try {
        const response = await api.post('/chatbot', {
            recipeId,
            question
        });
        return response.data;
    } catch (error) {
        throw new Error('Error asking chatbot: ' + error.message);
    }
};