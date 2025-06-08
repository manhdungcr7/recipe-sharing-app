const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const config = require('../config/config');
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

// @route   POST /api/auth/google
// @desc    Login with Google
// @access  Public
router.post('/google', authController.googleLogin);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    // req.user đã được thiết lập từ middleware protect
    const connection = await pool.getConnection();
    
    // Lấy thông tin người dùng hiện tại từ database
    const [user] = await connection.query(
      'SELECT id, name, email, role, picture FROM users WHERE id = ?',
      [req.user.id]
    );
    
    connection.release();
    
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user[0]
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side)
// @access  Private
router.post('/logout', protect, authController.logout);

// @route   GET /api/auth/time
// @desc    Get server time
// @access  Public
router.get('/time', (req, res) => {
  const now = new Date();
  res.json({ 
    serverTime: Math.floor(now.getTime() / 1000),
    timeString: now.toString(),
    utcTimeString: now.toUTCString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
});

// Thêm route debug
router.get('/debug', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.json({
      success: false,
      message: 'No token provided',
      headers: req.headers
    });
  }
  
  try {
    const decoded = jwt.verify(token, config.app.jwtSecret);
    return res.json({
      success: true,
      message: 'Token valid',
      userId: decoded.id,
      tokenInfo: {
        exp: new Date(decoded.exp * 1000).toISOString(),
        iat: new Date(decoded.iat * 1000).toISOString(),
      }
    });
  } catch (error) {
    return res.json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
});

// Thêm endpoint để kiểm tra trạng thái đăng nhập
router.get('/debug-auth', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let decoded = null;
    let user = null;
    
    if (token) {
      try {
        decoded = jwt.verify(token, config.app.jwtSecret);
        
        const connection = await pool.getConnection();
        const [users] = await connection.query(
          'SELECT id, name, email, picture, role FROM users WHERE id = ?',
          [decoded.id]
        );
        connection.release();
        
        if (users.length > 0) {
          user = users[0];
        }
      } catch (error) {
        console.error("Token verification error:", error);
        decoded = { error: error.message };
      }
    }
    
    res.json({
      tokenProvided: !!token,
      tokenValid: !!decoded && !decoded.error,
      userData: user,
      decodedToken: decoded
    });
  } catch (error) {
    console.error("Debug auth error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Thêm API endpoint để debug JWT
router.get('/debug-jwt', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || 'no-token';
    
    // Hiển thị cấu hình JWT
    console.log('JWT secret check:', {
      jwtSecret: config.app.jwtSecret ? 'Defined' : 'Undefined',
      jwtSecretLength: config.app.jwtSecret ? config.app.jwtSecret.length : 0,
      jwtExpiry: config.app.jwtExpiry || '30d'
    });
    
    // Thử verify token nếu có
    let decoded = null;
    if (token && token !== 'no-token') {
      try {
        decoded = jwt.verify(token, config.app.jwtSecret);
        console.log('Token verified successfully');
      } catch (verifyError) {
        console.error('Token verification error:', verifyError);
      }
    }
    
    res.json({
      jwtSecretDefined: !!config.app.jwtSecret,
      tokenProvided: token !== 'no-token',
      decoded,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('JWT debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;