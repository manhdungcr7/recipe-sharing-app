/**
 * Middleware kiểm tra trạng thái tài khoản người dùng
 * Chặn người dùng bị khóa tài khoản không thể thực hiện các thao tác tương tác
 */
const { pool } = require('../config/db');

exports.checkAccountStatus = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện hành động này'
      });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT is_blocked FROM users WHERE id = ?',
      [req.user.id]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    if (users[0].is_blocked) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking account status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra trạng thái tài khoản'
    });
  }
};