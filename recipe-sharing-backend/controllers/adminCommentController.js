const { pool } = require('../config/db');
const notificationController = require('./notificationController');

// Xóa bình luận (dành cho admin)
exports.deleteComment = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    
    // Kiểm tra bình luận có tồn tại không
    const [comments] = await connection.query(
      'SELECT user_id, recipe_id, content FROM comments WHERE id = ?',
      [id]
    );
    
    if (comments.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }
    
    const userId = comments[0].user_id;
    
    // Xóa báo cáo về bình luận này
    await connection.query('DELETE FROM reports WHERE type = "comment" AND reported_id = ?', [id]);
    
    // Xóa bình luận
    await connection.query('DELETE FROM comments WHERE id = ?', [id]);
    
    // Gửi thông báo cho người viết bình luận
    const notificationData = {
      user_id: userId,
      type: 'comment_deleted',
      title: 'Bình luận bị xóa',
      content: 'Bình luận của bạn đã bị quản trị viên xóa do vi phạm quy định.',
      reference_id: comments[0].recipe_id,
      reference_type: 'recipe'
    };
    
    await notificationController.createNotification(notificationData);
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa bình luận'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bình luận',
      error: error.message
    });
  }
};