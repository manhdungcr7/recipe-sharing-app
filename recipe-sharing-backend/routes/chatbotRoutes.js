const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

// @route   POST /api/chatbot/ask
// @desc    Ask question to chatbot
// @access  Public
router.post('/ask', chatbotController.askChatbot);

// Thêm các route khác nếu cần
// router.post('/feedback', protect, chatbotController.sendFeedback);

module.exports = router;