const { pool } = require('../../config/db');

exports.restoreRecipe = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user.id;
    // Kiểm tra quyền sở hữu
    const [recipes] = await connection.query(
      `SELECT id FROM recipes WHERE id = ? AND author_id = ? AND is_deleted = 1`,
      [id, userId]
    );
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài hoặc không có quyền khôi phục' });
    }
    await connection.query(
      `UPDATE recipes SET is_deleted = 0, deleted_at = NULL WHERE id = ?`,
      [id]
    );
    connection.release();
    res.json({ success: true, message: 'Đã khôi phục bài đăng' });
  } catch (error) {
    connection.release();
    res.status(500).json({ success: false, message: 'Lỗi khi khôi phục bài đăng', error: error.message });
  }
};