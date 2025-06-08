const { pool } = require('../../config/db');

/**
 * Xóa công thức
 * @route   DELETE /api/recipes/:id
 * @access  Private
 */
exports.deleteRecipe = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Kiểm tra quyền sở hữu công thức
    const [recipes] = await connection.query(
      `SELECT id FROM recipes 
       WHERE id = ? AND author_id = ?`,
      [req.params.id, req.user.id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức hoặc không có quyền xóa'
      });
    }
    
    // Thực hiện xóa mềm (soft delete)
    await connection.query(
      `UPDATE recipes SET is_deleted = 1, deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND author_id = ?`,
      [req.params.id, req.user.id]
    );
    
    connection.release();
    
    res.json({
      success: true,
      message: 'Công thức đã được xóa'
    });
    
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công thức',
      error: error.message
    });
    
    if (connection) connection.release();
  }
};