const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { protect, admin } = require('../middleware/auth');

// Controllers
const recipeController = require('../controllers/recipeController');
const reportController = require('../controllers/reportController');
const adminReportController = require('../controllers/adminReportController');
const notificationController = require('../controllers/notificationController');
const adminUserController = require('../controllers/adminUserController');
const adminRecipeController = require('../controllers/adminRecipeController');
const adminCommentController = require('../controllers/adminCommentController');

// Thống kê tổng quan
router.get('/stats', admin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Tổng số người dùng
    const [totalUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    // Người dùng mới trong 7 ngày
    const [newUsers] = await connection.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    
    // Tổng số công thức
    const [totalRecipes] = await connection.query('SELECT COUNT(*) as count FROM recipes');
    
    // Công thức chờ duyệt
    const [pendingRecipes] = await connection.query(
      'SELECT COUNT(*) as count FROM recipes WHERE status = "pending_review"'
    );
    
    // Tổng số báo cáo
    const [totalReports] = await connection.query('SELECT COUNT(*) as count FROM reports');
    
    // Báo cáo chưa xử lý
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

// APIs quản lý người dùng - Kiểm tra xem các hàm này có tồn tại trong userController
// Nếu không có, cần tạo các hàm này hoặc thay thế bằng middleware trực tiếp
router.get('/users', admin, async (req, res) => { // Thay thế userController.getAllUsers
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      `SELECT id, name, email, picture, role, is_verified, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    connection.release();
    
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng'
    });
  }
});

router.put('/users/:id', admin, async (req, res) => { // Thay thế userController.updateUserByAdmin
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

router.delete('/users/:id', admin, async (req, res) => { // Thay thế userController.deleteUser
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

// APIs quản lý công thức - Kiểm tra xem các hàm này có tồn tại trong recipeController
router.get('/recipes', admin, async (req, res) => { // Thay thế recipeController.getAllRecipesForAdmin
  try {
    const connection = await pool.getConnection();
    const [recipes] = await connection.query(
      `SELECT r.id, r.title, r.image_url, r.status, r.created_at, 
              u.name as author_name 
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       ORDER BY r.created_at DESC`
    );
    connection.release();
    
    res.status(200).json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công thức'
    });
  }
});

router.put('/recipes/:id/approve', admin, async (req, res) => { // Thay thế recipeController.approveRecipe
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    await connection.query(
      `UPDATE recipes SET status = 'published' WHERE id = ?`,
      [id]
    );
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Phê duyệt công thức thành công'
    });
  } catch (error) {
    console.error('Error approving recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phê duyệt công thức'
    });
  }
});

router.put('/recipes/:id/reject', admin, async (req, res) => { // Thay thế recipeController.rejectRecipe
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    await connection.query(
      `UPDATE recipes SET status = 'rejected' WHERE id = ?`,
      [id]
    );
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Từ chối công thức thành công'
    });
  } catch (error) {
    console.error('Error rejecting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi từ chối công thức'
    });
  }
});

// Endpoints cho báo cáo
router.post('/reports', auth, reportController.createReport);
router.get('/reports/:id', auth, reportController.getReport);

// Endpoints cho admin quản lý báo cáo
router.get('/admin/reports', auth, adminMiddleware, adminReportController.getReports);
router.get('/admin/reports/:id', auth, adminMiddleware, adminReportController.getReport);
router.patch('/admin/reports/:id/status', auth, adminMiddleware, adminReportController.updateReportStatus);
router.post('/admin/reports/:id/respond', auth, adminMiddleware, adminReportController.respondToReport);

// Thêm routes cho quản lý báo cáo
router.get('/reports', admin, adminReportController.getReports);
router.get('/reports/:id', admin, adminReportController.getReportDetail);
router.put('/reports/:id/status', admin, adminReportController.updateReportStatus);
router.post('/reports/:id/respond', admin, adminReportController.respondToReport);

// Endpoints cho quản lý thông báo
router.get('/notifications', auth, notificationController.getUserNotifications);
router.get('/notifications/unread-count', auth, notificationController.getUnreadCount);
router.post('/notifications/:id/read', auth, notificationController.markAsRead);
router.post('/notifications/read-all', auth, notificationController.markAllAsRead);
router.post('/notifications/:id/reply', auth, notificationController.replyToAdmin);
router.post('/notifications/message-admin', auth, notificationController.messageAdmin);

// Thêm routes cho quản lý người dùng
router.post('/users/:id/suspend', admin, adminUserController.suspendUser);
router.post('/users/:id/unsuspend', admin, adminUserController.unsuspendUser);
router.delete('/users/:id', admin, adminUserController.deleteUser);

// Thêm routes cho quản lý công thức
router.delete('/recipes/:id', admin, adminRecipeController.deleteRecipe);
router.put('/recipes/:id/approve', admin, adminRecipeController.approveRecipe);
router.put('/recipes/:id/reject', admin, adminRecipeController.rejectRecipe);

// Thêm routes cho quản lý bình luận
router.delete('/comments/:id', admin, adminCommentController.deleteComment);

module.exports = router;