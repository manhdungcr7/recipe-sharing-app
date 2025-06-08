const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { protect } = require('../middleware/auth');

// Route cho GET /api/user/recipes/:userId
router.get('/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching recipes for user ${userId}`);
    
    // Kiểm tra userId
    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp ID người dùng hợp lệ'
      });
    }
    
    const connection = await pool.getConnection();
    
    // Lấy danh sách công thức của user
    const [recipes] = await connection.query(`
      SELECT r.*, 
             u.name as author_name, 
             u.picture as author_picture,
             (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments_count
      FROM recipes r
      LEFT JOIN users u ON r.author_id = u.id
      WHERE r.author_id = ? AND r.status = 'published' AND r.is_deleted = 0
      ORDER BY r.created_at DESC
    `, [userId]);
    
    connection.release();
    
    res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes
    });
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách công thức của người dùng', 
      error: error.message 
    });
  }
});

module.exports = router;