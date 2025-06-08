const chatbotService = require('../services/chatbotService');

exports.getChatbotResponse = async (req, res) => {
    const userMessage = req.body.message;

    try {
        const response = await chatbotService.getResponse(userMessage);
        res.status(200).json({ response });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
};