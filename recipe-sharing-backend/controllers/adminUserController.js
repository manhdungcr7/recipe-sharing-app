const { pool } = require('../config/db');
const notificationController = require('./notificationController');

// Khóa tài khoản người dùng
exports.suspendUser = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { days, reason } = req.body;
    const adminId = req.user.id;
    
    if (!days || isNaN(days) || days <= 0 || days > 30) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian khóa phải từ 1 đến 30 ngày'
      });
    }
    
    connection = await pool.getConnection();
    
    // Kiểm tra người dùng có tồn tại không
    const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Kiểm tra xem có phải khóa admin khác không
    if (users[0].role === 'admin' && users[0].id !== adminId) {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Không thể khóa tài khoản admin khác'
      });
    }
    
    // Tính thời gian hết hạn
    const suspendUntil = new Date();
    suspendUntil.setDate(suspendUntil.getDate() + parseInt(days));
    
    // Cập nhật trạng thái tài khoản
    await connection.query(
      'UPDATE users SET is_suspended = 1, suspended_until = ?, suspended_reason = ? WHERE id = ?',
      [suspendUntil, reason || 'Vi phạm quy định', id]
    );
    
    // Gửi thông báo cho người dùng
    const notificationData = {
      user_id: id,
      type: 'account_suspended',
      title: 'Tài khoản bị khóa',
      content: `Tài khoản của bạn đã bị khóa ${days} ngày. Lý do: ${reason || 'Vi phạm quy định'}`,
      reference_id: id,
      reference_type: 'user'
    };
    
    await notificationController.createNotification(notificationData);
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: `Đã khóa tài khoản người dùng ${days} ngày`
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi khóa tài khoản người dùng',
      error: error.message
    });
  }
};

// Xóa tài khoản người dùng
exports.deleteUser = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    
    connection = await pool.getConnection();
    
    // Kiểm tra người dùng có tồn tại không
    const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Kiểm tra xem có phải xóa admin khác không
    if (users[0].role === 'admin' && users[0].id !== adminId) {
      connection.release();
      return res.status(403).json({
        success: false,
        message: 'Không thể xóa tài khoản admin khác'
      });
    }
    
    // Xóa tài khoản và các dữ liệu liên quan
    await connection.beginTransaction();
    
    // Xóa các thông báo
    await connection.query('DELETE FROM notifications WHERE user_id = ?', [id]);
    
    // Xóa các báo cáo
    await connection.query('DELETE FROM reports WHERE reporter_id = ?', [id]);
    
    // Xóa các bình luận
    await connection.query('DELETE FROM comments WHERE user_id = ?', [id]);
    
    // Xóa các công thức
    await connection.query('DELETE FROM recipes WHERE author_id = ?', [id]);
    
    // Xóa các tương tác
    await connection.query('DELETE FROM liked_recipes WHERE user_id = ?', [id]);
    await connection.query('DELETE FROM saved_recipes WHERE user_id = ?', [id]);
    await connection.query('DELETE FROM recipe_views WHERE user_id = ?', [id]);
    
    // Xóa người dùng
    await connection.query('DELETE FROM users WHERE id = ?', [id]);
    
    await connection.commit();
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa tài khoản người dùng và dữ liệu liên quan'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tài khoản người dùng',
      error: error.message
    });
  }
};