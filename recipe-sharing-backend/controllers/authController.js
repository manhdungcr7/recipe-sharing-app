const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const config = require('../config/config');
const bcrypt = require('bcryptjs');

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
      if (user.picture && !user.picture.includes('googleusercontent.com')) {
        // Không cập nhật picture, chỉ cập nhật các thông tin khác
        await connection.query(
          'UPDATE users SET name = ? WHERE id = ?',
          [name, user.id]
        );
      } else {
        // Nếu chưa có picture hoặc đang dùng ảnh Google thì mới cập nhật
        await connection.query(
          'UPDATE users SET name = ?, picture = ? WHERE id = ?',
          [name, picture, user.id]
        );
      }
      
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

// Hàm lấy thông tin user hiện tại (me)
exports.me = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, name, email, role, picture FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống: ' + error.message
    });
  }
};

// @desc    Login as Admin
// @route   POST /api/auth/admin
// @access  Public
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const connection = await pool.getConnection();
    
    // Kiểm tra user tồn tại không
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Thông tin đăng nhập không chính xác'
      });
    }
    
    const user = users[0];
    
    // So sánh password (giả sử password được mã hóa bằng bcrypt)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Thông tin đăng nhập không chính xác'
      });
    }
    
    // Kiểm tra role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }
    
    const token = generateToken(user.id);
    
    // Dữ liệu người dùng (không bao gồm password)
    const { password: _, ...userData } = user;
    
    connection.release();
    
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        // ...các trường khác nếu cần
      },
      message: 'Đăng nhập admin thành công'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng nhập admin: ' + error.message
    });
  }
};