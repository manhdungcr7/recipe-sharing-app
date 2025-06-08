const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { protect } = require('../middleware/auth');

// Route cho GET /api/user/saved-recipes
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching saved recipes for user ${userId}`);
    
    const connection = await pool.getConnection();
    
    // Kiểm tra xem bảng saved_recipes có tồn tại không
    const [tableCheck] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'saved_recipes'
    `);
    
    // Nếu bảng không tồn tại, tạo bảng
    if (tableCheck[0].count === 0) {
      await connection.query(`
        CREATE TABLE saved_recipes (
          id INT(11) NOT NULL AUTO_INCREMENT,
          user_id INT(11) NOT NULL,
          recipe_id INT(11) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY unique_user_recipe (user_id, recipe_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        )
      `);
      console.log('saved_recipes table created automatically');
    }
    
    // Lấy danh sách công thức đã lưu kèm thông tin tác giả
    const [recipes] = await connection.query(`
      SELECT r.*, u.name as author_name, u.picture as author_picture
      FROM recipes r
      JOIN saved_recipes sr ON r.id = sr.recipe_id
      JOIN users u ON r.author_id = u.id
      WHERE sr.user_id = ? AND r.is_deleted = 0
      ORDER BY sr.created_at DESC
    `, [userId]);
    
    console.log(`Found ${recipes.length} saved recipes for user ${userId}`);
    
    connection.release();
    
    res.status(200).json({
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