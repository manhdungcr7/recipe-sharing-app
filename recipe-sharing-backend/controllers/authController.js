const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const config = require('../config/config');

// Tăng clockTolerance lên một giá trị lớn hơn để xử lý sự chênh lệch thời gian của server
const client = new OAuth2Client({
  clientId: config.app.googleClientId,
  // Cho phép sai lệch thời gian lên đến 24 giờ (86400 giây)
  clockTolerance: 86400
});

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, config.app.jwtSecret, {
    expiresIn: config.app.jwtExpiry || '30d'
  });
};

// @desc    Login with Google
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { tokenId } = req.body;
    
    // Debug
    console.log("Received Google token:", tokenId ? "Token exists" : "No token");

    // Sửa cấu hình verification để bỏ qua kiểm tra thời gian
    const response = await client.verifyIdToken({
      idToken: tokenId,
      audience: config.app.googleClientId,
      // Tăng clockTolerance tại đây cũng, đảm bảo đủ lớn để xử lý chênh lệch thời gian
      clockTolerance: 86400 // 24 giờ
    });
    
    const { email_verified, name, email, picture, sub } = response.payload;
    
    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email Google chưa được xác minh'
      });
    }
    
    // Phần code còn lại giữ nguyên
    const connection = await pool.getConnection();
    
    // Kiểm tra nếu email đã tồn tại
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      // Người dùng đã tồn tại, đăng nhập
      const user = existingUsers[0];
      
      // Cập nhật thông tin mới nhất nếu cần
      await connection.query(
        'UPDATE users SET google_id = ?, picture = ? WHERE id = ?',
        [sub, picture, user.id]
      );
      
      const token = generateToken(user.id);
      
      // Chuẩn bị dữ liệu người dùng để trả về
      const userData = {
        id: user.id,  // Đảm bảo có ID
        name: user.name || name,
        email: user.email || email,
        picture: user.picture || picture,
        role: user.role || 'user',
        is_verified: 1
      };
      
      connection.release();
      
      return res.status(200).json({
        success: true,
        token,
        user: userData,
        message: 'Đăng nhập thành công'
      });
    } else {
      // Đây là người dùng mới, tạo tài khoản
      const [result] = await connection.query(
        `INSERT INTO users (name, email, google_id, picture, is_verified, role) 
         VALUES (?, ?, ?, ?, 1, 'user')`,
        [name, email, sub, picture]
      );
      
      const newUserId = result.insertId;
      const token = generateToken(newUserId);
      
      // Dữ liệu người dùng mới
      const userData = {
        id: newUserId,  // ID từ kết quả insert
        name: name,
        email: email,
        picture: picture,
        role: 'user',
        is_verified: 1
      };
      
      connection.release();
      
      return res.status(201).json({
        success: true,
        token,
        user: userData,
        message: 'Tài khoản mới đã được tạo với Google'
      });
    }
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực Google: ' + error.message
    });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  // Logout xử lý phía client
  res.status(200).json({
    success: true,
    message: 'Đã đăng xuất thành công'
  });
};