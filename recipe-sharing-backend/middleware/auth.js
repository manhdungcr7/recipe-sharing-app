const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const config = require('../config/config');  // Đảm bảo import config

// Sửa lại hàm protect để sử dụng secret từ config
exports.protect = async (req, res, next) => {
  try {
    console.log("==== AUTH MIDDLEWARE ====");
    let token;

    // Kiểm tra header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log("Token found: YES");
    } else {
      console.log("No token provided");
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để truy cập tính năng này'
      });
    }

    try {
      // Sửa đây: Sử dụng config.app.jwtSecret thay vì config.jwtSecret
      const decoded = jwt.verify(token, config.app.jwtSecret);
      console.log("Token decoded successfully for user ID:", decoded.id);

      // Truy vấn người dùng từ database
      const connection = await pool.getConnection();
      const [users] = await connection.query(
        'SELECT id, name, email, role, picture FROM users WHERE id = ?',
        [decoded.id]
      );
      connection.release();

      if (users.length === 0) {
        console.log("User not found in DB");
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      req.user = users[0];
      console.log(`User authenticated: ${req.user.name} (${req.user.id})`);
      next();
    } catch (jwtError) {
      console.error("Auth middleware error:", jwtError);
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống'
    });
  }
};

// Thêm middleware này nếu chưa có
exports.admin = async (req, res, next) => {
  try {
    // Kiểm tra xem người dùng đã xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục'
      });
    }
    
    // Kiểm tra vai trò admin
    const [users] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!users.length || users[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
};