const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const config = require('../config/config');  // Đảm bảo import config

// Kiểm tra token hiện tại
exports.protect = async (req, res, next) => {
  try {
    console.log("Auth middleware running");
    let token;
    
    // Kiểm tra token từ header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log("==== AUTH MIDDLEWARE ====");
      console.log("Token found:", token ? "YES" : "NO");
    }
    
    // Nếu không có token
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực'
      });
    }
    
    // Giải mã token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully for user ID:", decoded.id);
      
      // Lấy thông tin user từ database
      const connection = await pool.getConnection();
      const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
      connection.release();
      
      if (users.length === 0) {
        console.log("User not found");
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }
      
      // Lưu thông tin user vào request
      req.user = users[0];
      console.log("User authenticated:", req.user.name, `(${req.user.id})`);
      next();
    } catch (error) {
      console.log("Auth middleware error:", error);
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Thêm middleware này nếu chưa có
exports.admin = [
  exports.protect, // Gọi protect trước
  async (req, res, next) => {
    try {
      // Kiểm tra vai trò admin (không cần kiểm tra req.user nữa vì protect đã làm)
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
  }
];