const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminUserController = require('../controllers/adminUserController');
const adminRecipeController = require('../controllers/adminRecipeController');
const adminReportController = require('../controllers/adminReportController');
const reportController = require('../controllers/reportController');
const adminCommentController = require('../controllers/adminCommentController');
const { protect, admin } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');
const { pool } = require('../config/db');
// Thêm import controller
const adminSettingsController = require('../controllers/adminSettingsController');
const adminNotificationController = require('../controllers/adminNotificationController');

// Đăng nhập admin - không cần middleware bảo vệ
router.post('/login', authController.adminLogin);

// Thống kê tổng quan
router.get('/stats', admin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [totalUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [newUsers] = await connection.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    const [totalRecipes] = await connection.query('SELECT COUNT(*) as count FROM recipes');
    const [pendingRecipes] = await connection.query(
      'SELECT COUNT(*) as count FROM recipes WHERE status = "pending_review"'
    );
    const [totalReports] = await connection.query('SELECT COUNT(*) as count FROM reports');
    const [unresolvedReports] = await connection.query(
      'SELECT COUNT(*) as count FROM reports WHERE status = "pending"'
    );
    connection.release();

    res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsers[0].count,
        newUsers: newUsers[0].count,
        totalRecipes: totalRecipes[0].count,
        pendingRecipes: pendingRecipes[0].count,
        totalReports: totalReports[0].count,
        unresolvedReports: unresolvedReports[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
});

// Người dùng mới nhất
router.get('/users/recent', admin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      `SELECT id, name, email, picture, is_verified, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT 10`
    );
    connection.release();

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng mới'
    });
  }
});

// Công thức mới nhất
router.get('/recipes/recent', admin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [recipes] = await connection.query(
      `SELECT r.id, r.title, r.image_url, r.status, r.created_at, 
              u.name as author_name 
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       ORDER BY r.created_at DESC
       LIMIT 10`
    );
    connection.release();

    res.status(200).json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error('Error fetching recent recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công thức mới'
    });
  }
});

// APIs quản lý người dùng
router.get('/users', admin, adminUserController.getUsers);

router.put('/users/:id', admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_verified } = req.body;

    const connection = await pool.getConnection();
    await connection.query(
      `UPDATE users SET 
        name = ?, 
        email = ?, 
        role = ?, 
        is_verified = ? 
       WHERE id = ?`,
      [name, email, role, is_verified, id]
    );
    connection.release();

    res.status(200).json({
      success: true,
      message: 'Cập nhật người dùng thành công'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật người dùng'
    });
  }
});

router.delete('/users/:id', admin, async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    await connection.query('DELETE FROM users WHERE id = ?', [id]);
    connection.release();

    res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa người dùng'
    });
  }
});

// APIs quản lý công thức
router.get('/recipes', admin, adminRecipeController.getRecipes);
router.put('/recipes/:id/approve', admin, /* xử lý */);
router.put('/recipes/:id/reject', admin, /* xử lý */);

// Thêm route xóa công thức ở đây
router.delete('/recipes/:id', admin, adminRecipeController.deleteRecipe);

// Endpoints cho báo cáo
// router.post('/reports', protect, reportController.createReport);
// router.get('/reports/:id', protect, reportController.getReport);

// Endpoints cho admin quản lý báo cáo
// router.get('/admin/reports', protect, admin, adminReportController.getReports);
// router.get('/admin/reports/:id', protect, admin, adminReportController.getReport);
// router.patch('/admin/reports/:id/status', protect, admin, adminReportController.updateReportStatus);
// router.post('/admin/reports/:id/respond', protect, admin, adminReportController.respondToReport);

// Thêm routes cho quản lý báo cáo - chỉ admin mới được truy cập
router.get('/reports', admin, adminReportController.getReports);
router.get('/reports/:id', admin, adminReportController.getReport);
router.patch('/reports/:id/status', admin, adminReportController.updateReportStatus);
router.post('/reports/:id/respond', admin, adminReportController.respondToReport);

// Route cho người dùng tạo báo cáo
//router.post('/user-reports', protect, reportController.createReport);

// Endpoints cho quản lý thông báo
router.get('/notifications', protect, notificationController.getUserNotifications);
router.get('/notifications/unread-count', protect, notificationController.getUnreadCount);
// router.post('/notifications/:id/read', protect, notificationController.markAsRead);
// router.post('/notifications/read-all', protect, notificationController.markAllAsRead);
//router.post('/notifications/:id/reply', protect, notificationController.replyToAdmin);
//router.post('/notifications/message-admin', protect, notificationController.messageAdmin;

// ========================
// CÁC ROUTE DƯỚI ĐÂY CÓ THỂ GÂY LỖI (NẾU CHƯA CÓ CONTROLLER)
// Nếu bạn chưa có các hàm này trong adminUserController, adminRecipeController, adminCommentController thì hãy COMMENT lại!
// ========================

router.post('/users/:id/suspend', admin, adminUserController.suspendUser);

// Thêm route gỡ khóa tài khoản
router.post('/users/:id/unsuspend', admin, adminUserController.unsuspendUser);

router.delete('/comments/:id', admin, adminCommentController.deleteComment);

router.delete('/recipes/:id', admin, adminRecipeController.deleteRecipe);

// Xóa công thức (dành cho admin)
exports.deleteRecipe = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    // Logic để xóa công thức...
  } catch (error) {
    // Xử lý lỗi...
  }
};

// Thêm routes cài đặt hệ thống (đặt ở cuối file trước module.exports)
// Cài đặt hệ thống
router.get('/settings', admin, adminSettingsController.getSettings);
router.put('/settings', admin, adminSettingsController.updateSettings);

// Thêm route (đặt cùng với các route users khác)
router.post('/users/:id/notify', admin, adminNotificationController.sendNotification);

// Thêm vào danh sách routes
router.get('/notifications', admin, adminNotificationController.getAdminNotifications);

module.exports = router;