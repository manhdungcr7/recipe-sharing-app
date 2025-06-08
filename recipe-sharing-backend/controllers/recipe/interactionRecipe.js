const { pool } = require('../../config/db');

/**
 * Like công thức
 * @route   POST /api/recipes/:id/like
 * @access  Private
 */
// Sửa hàm likeRecipe để trả về số lượng like hiện tại
exports.likeRecipe = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    connection = await pool.getConnection();
    
    // Kiểm tra xem công thức có tồn tại không
    const [recipes] = await connection.query(
      'SELECT * FROM recipes WHERE id = ? AND is_deleted = 0',
      [id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }
    
    // Kiểm tra xem đã like chưa
    const [likes] = await connection.query(
      'SELECT * FROM liked_recipes WHERE user_id = ? AND recipe_id = ?',
      [userId, id]
    );
    
    let liked = true;
    
    if (likes.length > 0) {
      // Đã like, xóa bỏ
      await connection.query(
        'DELETE FROM liked_recipes WHERE user_id = ? AND recipe_id = ?',
        [userId, id]
      );
      liked = false;
    } else {
      // Chưa like, thêm mới
      await connection.query(
        'INSERT INTO liked_recipes (user_id, recipe_id) VALUES (?, ?)',
        [userId, id]
      );
    }
    
    // Lấy số lượng like hiện tại
    const [likesCount] = await connection.query(
      'SELECT COUNT(*) as count FROM liked_recipes WHERE recipe_id = ?',
      [id]
    );
    
    connection.release();
    
    return res.json({
      success: true,
      message: liked ? 'Đã thích công thức' : 'Đã bỏ thích công thức',
      data: {
        liked: liked,
        likesCount: likesCount[0].count
      }
    });
  } catch (error) {
    console.error('Error liking/unliking recipe:', error);
    
    if (connection) connection.release();
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thích/bỏ thích công thức',
      error: error.message
    });
  }
};
/**
 * Lưu công thức
 * @route   POST /api/recipes/:id/save
 * @access  Private
 */
exports.saveRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log(`User ${userId} attempting to save recipe ${id}`);
    
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
    
    // Kiểm tra xem công thức đã được lưu chưa
    const [existingRecords] = await connection.query(
      `SELECT * FROM saved_recipes WHERE user_id = ? AND recipe_id = ?`,
      [userId, id]
    );
    
    if (existingRecords.length > 0) {
      connection.release();
      return res.status(200).json({
        success: true,
        message: 'Công thức này đã được lưu'
      });
    }
    
    // Lưu công thức
    await connection.query(
      `INSERT INTO saved_recipes (user_id, recipe_id) VALUES (?, ?)`,
      [userId, id]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã lưu công thức thành công'
    });
  } catch (error) {
    console.error('Error saving recipe:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lưu công thức: ' + error.message, 
      error: error.message 
    });
  }
};

/**
 * Bỏ lưu công thức
 * @route   DELETE /api/recipes/:id/save
 * @access  Private
 */
exports.unsaveRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const connection = await pool.getConnection();
    
    // Xóa bản ghi lưu
    await connection.query(
      `DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?`,
      [userId, id]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã bỏ lưu công thức thành công'
    });
  } catch (error) {
    console.error('Error unsaving recipe:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi bỏ lưu công thức', 
      error: error.message 
    });
  }
};