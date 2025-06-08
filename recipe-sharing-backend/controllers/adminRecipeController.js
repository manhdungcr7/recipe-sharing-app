const { pool } = require('../config/db');
const notificationController = require('./notificationController');

// Xóa công thức (dành cho admin)
exports.deleteRecipe = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    
    // Kiểm tra công thức có tồn tại không
    const [recipes] = await connection.query(
      'SELECT author_id, title FROM recipes WHERE id = ?',
      [id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }
    
    // Bắt đầu giao dịch
    await connection.beginTransaction();
    
    // Lấy thông tin tác giả và tiêu đề
    const authorId = recipes[0].author_id;
    const recipeTitle = recipes[0].title;
    
    // Xóa các bình luận
    await connection.query('DELETE FROM comments WHERE recipe_id = ?', [id]);
    
    // Xóa các tương tác
    await connection.query('DELETE FROM liked_recipes WHERE recipe_id = ?', [id]);
    await connection.query('DELETE FROM saved_recipes WHERE recipe_id = ?', [id]);
    await connection.query('DELETE FROM recipe_views WHERE recipe_id = ?', [id]);
    
    // Xóa các báo cáo liên quan
    await connection.query('DELETE FROM reports WHERE (type = "recipe" AND reported_id = ?) OR recipe_id = ?', [id, id]);
    
    // Xóa các thành phần của công thức
    await connection.query('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);
    await connection.query('DELETE FROM recipe_steps WHERE recipe_id = ?', [id]);
    
    // Xóa công thức
    await connection.query('DELETE FROM recipes WHERE id = ?', [id]);
    
    // Gửi thông báo cho tác giả
    const notificationData = {
      user_id: authorId,
      type: 'recipe_deleted',
      title: 'Công thức bị xóa',
      content: `Công thức "${recipeTitle}" của bạn đã bị quản trị viên xóa do vi phạm quy định.`,
      reference_id: id,
      reference_type: 'recipe'
    };
    
    await notificationController.createNotification(notificationData);
    
    // Hoàn thành giao dịch
    await connection.commit();
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa công thức và dữ liệu liên quan'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công thức',
      error: error.message
    });
  }
};