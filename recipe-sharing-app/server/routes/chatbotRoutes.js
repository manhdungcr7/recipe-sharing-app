const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Route to handle chatbot interactions
router.post('/interact', chatbotController.handleInteraction);

// Route to get chatbot responses
router.get('/response', chatbotController.getResponse);

module.exports = router;