const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { pool } = require('../config/db');
const { avatarUpload } = require('../middleware/upload');
const { checkAccountStatus } = require('../middleware/checkAccountStatus');

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get('/:id', userController.getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, checkAccountStatus, userController.updateProfile);

// @route   POST /api/users/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', protect, checkAccountStatus, avatarUpload, userController.uploadAvatar);

// API lấy trạng thái theo dõi
router.get('/:id/follow-status', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    
    const [followStatus] = await pool.query(
      'SELECT * FROM follows WHERE follower_id = ? AND followed_id = ?',
      [userId, targetId]
    );
    
    res.json({
      success: true,
      following: followStatus.length > 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái theo dõi',
      error: error.message
    });
  }
});

// API theo dõi người dùng
router.post('/:id/follow', protect, checkAccountStatus, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    
    // Kiểm tra nếu đã theo dõi rồi
    const [existingFollow] = await pool.query(
      'SELECT * FROM follows WHERE follower_id = ? AND followed_id = ?',
      [userId, targetId]
    );
    
    if (existingFollow.length > 0) {
      return res.json({
        success: true,
        message: 'Bạn đã theo dõi người dùng này rồi'
      });
    }
    
    // Thêm vào bảng follows
    await pool.query(
      'INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)',
      [userId, targetId]
    );
    
    res.json({
      success: true,
      message: 'Theo dõi thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi theo dõi người dùng',
      error: error.message
    });
  }
});

// API hủy theo dõi
router.post('/:id/unfollow', protect, checkAccountStatus, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    
    // Xóa khỏi bảng follows
    await pool.query(
      'DELETE FROM follows WHERE follower_id = ? AND followed_id = ?',
      [userId, targetId]
    );
    
    res.json({
      success: true,
      message: 'Hủy theo dõi thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy theo dõi người dùng',
      error: error.message
    });
  }
});

// Lấy tất cả công thức đã xuất bản của user
router.get('/:userId/recipes', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    const status = req.query.status || 'published';
    
    const connection = await pool.getConnection();
    
    // Xử lý trường hợp status=trash riêng biệt
    let query, params;
    
    if (status === 'trash') {
      // Trường hợp thùng rác - lấy công thức đã bị xóa
      query = `
        SELECT r.*, u.name as author_name, u.picture as author_picture 
        FROM recipes r
        JOIN users u ON r.author_id = u.id
        WHERE r.author_id = ? AND r.is_deleted = 1 
        ORDER BY r.deleted_at DESC
      `;
      params = [userId];
    } else {
      // Các trường hợp khác - lấy công thức chưa bị xóa
      query = `
        SELECT r.*, u.name as author_name, u.picture as author_picture 
        FROM recipes r
        JOIN users u ON r.author_id = u.id
        WHERE r.author_id = ? AND r.is_deleted = 0
      `;
      params = [userId];
      
      if (status && status !== 'all') {
        query += ` AND r.status = ?`;
        params.push(status);
      }
      
      query += ` ORDER BY r.created_at DESC`;
    }
    
    const [recipes] = await connection.query(query, params);
    connection.release();
    
    res.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error('Error getting user recipes:', error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công thức',
      error: error.message
    });
  }
});

router.get('/:id/stats', userController.getUserStats);
router.get('/:id/followers', userController.getFollowers);
router.get('/:id/following', userController.getFollowing);

// Thêm route này:
router.get('/:id/recipes', protect, userController.getUserRecipes);

// Lấy thông tin user theo id (public)
router.get('/:id', userController.getUserById);

module.exports = router;