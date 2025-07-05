const { pool } = require('../config/db');
const notificationController = require('./notificationController');

// Gửi thông báo đến người dùng
exports.sendNotification = async (req, res) => {
  let connection;
  try {
    const { id } = req.params; // ID người dùng nhận thông báo
    const { message, type } = req.body;
    const adminId = req.user.id;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung thông báo không được để trống'
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
    
    // Tạo thông báo
    await notificationController.createNotification({
      recipient_id: id,
      sender_id: adminId,
      type: 'admin_message',  // Đúng: 'admin_message' là giá trị hợp lệ
      content: message,
    });
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã gửi thông báo thành công'
    });
  } catch (error) {
    console.error('Error sending notification to user:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi thông báo',
      error: error.message
    });
  }
};

exports.getAdminNotifications = async (req, res) => {
  let connection;
  try {
    const { type } = req.query;
    connection = await pool.getConnection();
    
    console.log('==== START DEBUG ====');
    console.log('Request User ID:', req.user.id);
    console.log('Query params:', req.query);

    let notifications = [];
    if (type === 'admin_message') {
      // LẤY TẤT CẢ tin nhắn admin_message BẤT KỂ recipient_id
      const [rows] = await connection.query(`
        SELECT n.*, u.name as sender_name, u.picture as sender_picture
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.type = 'admin_message'
        ORDER BY n.created_at DESC
      `);
      notifications = rows;
      console.log('Found admin messages:', rows.length);
    } else {
      // Các loại thông báo khác vẫn lọc theo recipient_id
      const [rows] = await connection.query(`
        SELECT n.*, u.name as sender_name, u.picture as sender_picture
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.recipient_id = ?
        ${type ? 'AND n.type = ?' : ''}
        ORDER BY n.created_at DESC
      `, type ? [req.user.id, type] : [req.user.id]);
      notifications = rows;
    }

    connection.release();
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting admin notifications:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông báo admin',
      error: error.message
    });
  }
};