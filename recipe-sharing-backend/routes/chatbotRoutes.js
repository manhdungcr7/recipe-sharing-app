const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// @route   POST /api/chatbot/ask
// @desc    Ask question to chatbot
// @access  Public
router.post('/ask', chatbotController.askChatbot);

module.exports = router;