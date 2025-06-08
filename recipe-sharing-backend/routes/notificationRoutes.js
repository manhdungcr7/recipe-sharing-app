const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

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
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
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

module.exports = router;