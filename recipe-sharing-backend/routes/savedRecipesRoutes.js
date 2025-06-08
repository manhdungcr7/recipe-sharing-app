const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { pool } = require('../config/db');

// Route cho GET /api/recipes/saved
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('userId in /api/recipes/saved:', userId);

    const connection = await pool.getConnection();
    
    // Lấy danh sách công thức đã lưu kèm thông tin tác giả
    const [recipes] = await connection.query(`
      SELECT r.*, u.name as author_name, u.picture as author_picture
      FROM recipes r
      JOIN saved_recipes sr ON r.id = sr.recipe_id
      JOIN users u ON r.author_id = u.id
      WHERE sr.user_id = ? AND r.is_deleted = 0
      ORDER BY sr.created_at DESC
    `, [userId]);

    console.log('Saved recipes result:', recipes); // THÊM DÒNG NÀY

    connection.release();
    
    res.json({
      success: true,
      count: recipes.length,
      data: recipes
    });
  } catch (error) {
    console.error('Error fetching saved recipes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách công thức đã lưu', 
      error: error.message 
    });
  }
});

module.exports = router;