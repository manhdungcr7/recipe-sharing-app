const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// @route   POST /api/messages/admin
// @desc    Send a message from user to admin
// @access  Private
router.post('/admin', protect, notificationController.sendMessageToAdmin);

module.exports = router;