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
      'SELECT user_id, recipe_id, text FROM comments WHERE id = ?',
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
    
    await connection.beginTransaction();
    
    // 1. Cập nhật các bình luận con trước, đặt parent_id thành NULL
    await connection.query('UPDATE comments SET parent_id = NULL WHERE parent_id = ?', [id]);
    
    // 2. Xóa báo cáo về bình luận này
    await connection.query('DELETE FROM reports WHERE type = "comment" AND reported_id = ?', [id]);
    
    // 3. Xóa bình luận cha
    await connection.query('DELETE FROM comments WHERE id = ?', [id]);
    
    // 4. Gửi thông báo cho người viết bình luận
    const notificationData = {
      recipient_id: userId,
      sender_id: req.user.id,
      type: 'moderation', 
      content: 'Bình luận của bạn đã bị quản trị viên xóa do vi phạm quy định.',
      related_recipe_id: comments[0].recipe_id
    };
    
    // Truyền thêm connection để dùng trong cùng transaction
    await notificationController.createNotification(notificationData, connection);
    
    await connection.commit();
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa bình luận thành công'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    
    if (connection) {
      try {
        await connection.rollback();
      } catch (err) {
        console.error('Error rolling back transaction:', err);
      } finally {
        connection.release();
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bình luận',
      error: error.message
    });
  }
};