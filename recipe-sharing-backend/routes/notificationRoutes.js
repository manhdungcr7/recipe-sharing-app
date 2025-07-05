const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
// Thêm import checkAccountStatus
const { checkAccountStatus } = require('../middleware/checkAccountStatus');
const notificationController = require('../controllers/notificationController');
const { pool } = require('../config/db');

// @route   GET /api/notifications
// @desc    Get all notifications for the current user
// @access  Private
router.get('/', protect, notificationController.getUserNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications for the current user
// @access  Private
router.get('/unread-count', protect, notificationController.getUnreadCount);

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:id/read', protect, notificationController.markAsRead);

// @route   PUT /api/notifications/markAllRead
// @desc    Mark all notifications as read for the current user
// @access  Private
router.put('/markAllRead', protect, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE notifications SET is_read = 1 WHERE recipient_id = ?',
      [req.user.id]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái thông báo'
    });
  }
});

// @route   POST /api/notifications/message-admin
// @desc    Send a message from user to admin
// @access  Private
router.post('/message-admin', protect, checkAccountStatus, notificationController.sendMessageToAdmin);

// @route   POST /api/notifications/:id/reply
// @desc    Reply to a notification from admin
// @access  Private
router.post('/:id/reply', protect, checkAccountStatus, notificationController.replyToNotification);

module.exports = router;