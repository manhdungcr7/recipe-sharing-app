const { pool } = require('../config/db');
const notificationController = require('./notificationController');

// Hàm tạo thông báo (để sử dụng trong các controller khác)
exports.createNotification = async (notificationData, existingConnection = null) => {
  let connection;
  let releaseConnection = true;
  
  try {
    const {
      recipient_id,   // Không phải user_id
      sender_id,      // Hoàn toàn thiếu!
      type,
      content,
      related_recipe_id, // Không phải reference_id
      related_comment_id
    } = notificationData;

    // Sử dụng kết nối được truyền vào hoặc tạo kết nối mới
    if (existingConnection) {
      connection = existingConnection;
      releaseConnection = false;  // Không cần release vì không phải kết nối mới
    } else {
      connection = await pool.getConnection();
    }

    await connection.query(
      `INSERT INTO notifications (recipient_id, sender_id, type, content, related_recipe_id, related_comment_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [recipient_id, sender_id, type, content, related_recipe_id, related_comment_id]
    );

    // Chỉ release nếu chúng ta đã tạo kết nối mới
    if (releaseConnection) connection.release();
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Chỉ release nếu chúng ta đã tạo kết nối mới
    if (connection && releaseConnection) connection.release();
    throw error;
  }
};

// Lấy thông báo của người dùng
exports.getUserNotifications = async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    
    connection = await pool.getConnection();
    
    const [notifications] = await connection.query(
      `SELECT n.*, u.name as sender_name, u.picture as sender_picture 
       FROM notifications n
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE n.recipient_id = ?
       ORDER BY n.created_at DESC`,
      [userId]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thông báo',
      error: error.message
    });
  }
};

// Đếm số thông báo chưa đọc
exports.getUnreadCount = async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    
    connection = await pool.getConnection();
    
    const [result] = await connection.query(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0',
      [userId]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      count: result[0].count
    });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đếm thông báo chưa đọc',
      error: error.message
    });
  }
};

// Đánh dấu thông báo đã đọc
exports.markAsRead = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userId = req.user.id;

    connection = await pool.getConnection();

    await connection.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?',
      [id, userId]
    );

    connection.release();

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    if (connection) connection.release();

    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái thông báo',
      error: error.message
    });
  }
};

// Đánh dấu tất cả thông báo là đã đọc
exports.markAllAsRead = async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    
    connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE notifications SET is_read = 1 WHERE recipient_id = ?',
      [userId]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh dấu tất cả thông báo',
      error: error.message
    });
  }
};

// Người dùng phản hồi thông báo từ admin
exports.replyToNotification = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { reply } = req.body; // Sửa thành "message" nếu frontend gửi lên field "message"
    const userId = req.user.id;
    
    // Kiểm tra thông báo có tồn tại không và thuộc về người dùng không
    connection = await pool.getConnection();
    const [notifications] = await connection.query(
      'SELECT * FROM notifications WHERE id = ? AND recipient_id = ?',
      [id, userId]
    );
    
    if (notifications.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Cập nhật phản hồi vào cơ sở dữ liệu
    await connection.query(
      'UPDATE notifications SET response_content = ?, response_timestamp = NOW() WHERE id = ?',
      [reply, id]
    );
    
    // Gửi thông báo cho admin về phản hồi mới
    const notification = notifications[0];
    await connection.query(
      `INSERT INTO notifications 
       (recipient_id, sender_id, type, content, related_recipe_id, related_comment_id, is_read, created_at)
       VALUES (?, ?, 'reply', ?, ?, ?, 0, NOW())`,
      [
        notification.sender_id,  // Gửi thông báo cho admin gốc
        userId,                  // Người gửi phản hồi
        `Phản hồi cho tin nhắn: ${notification.content.substring(0, 30)}...`,
        notification.related_recipe_id,
        notification.related_comment_id
      ]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã gửi phản hồi thành công'
    });
  } catch (error) {
    console.error('Error replying to notification:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false, 
      message: 'Lỗi khi gửi phản hồi',
      error: error.message
    });
  }
};

// Người dùng gửi tin nhắn cho admin
exports.sendMessageToAdmin = async (req, res) => {
  let connection;
  try {
    const { message } = req.body;
    const userId = req.user.id;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không được để trống'
      });
    }
    
    connection = await pool.getConnection();
    
    // Tìm ADMIN ĐANG ĐĂNG NHẬP thay vì admin đầu tiên
    const [currentAdmin] = await connection.query('SELECT id FROM users WHERE id = ? AND role = "admin"', [12]);
    
    if (currentAdmin.length > 0) {
      // Gửi tin nhắn cho admin đang đăng nhập
      await connection.query(
        `INSERT INTO notifications 
         (recipient_id, sender_id, type, content, is_read, created_at)
         VALUES (?, ?, 'admin_message', ?, 0, NOW())`,
        [currentAdmin[0].id, userId, message]
      );
      
      connection.release();
      
      return res.status(201).json({
        success: true,
        message: 'Đã gửi tin nhắn cho admin thành công'
      });
    }
    
    // Nếu không tìm thấy admin với ID=12, quay lại tìm admin đầu tiên
    const [admins] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    
    if (admins.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin để gửi tin nhắn'
      });
    }
    
    // Tạo thông báo cho admin đầu tiên
    await connection.query(
      `INSERT INTO notifications 
       (recipient_id, sender_id, type, content, is_read, created_at)
       VALUES (?, ?, 'admin_message', ?, 0, NOW())`,
      [admins[0].id, userId, message]
    );
    
    connection.release();
    
    res.status(201).json({
      success: true,
      message: 'Đã gửi tin nhắn cho admin thành công'
    });
  } catch (error) {
    console.error('Error sending message to admin:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi tin nhắn',
      error: error.message
    });
  }
};

// Gửi thông báo đến người theo dõi
exports.notifyFollowers = async (recipeId, message) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Lấy danh sách người theo dõi
    const [followers] = await connection.query(
      'SELECT follower_id FROM followers WHERE user_id = ?',
      [recipeId]
    );
    
    console.log('Followers:', followers);
    for (const follower of followers) {
      console.log('Sending notification to:', follower.follower_id);
      await notificationController.createNotification({
        recipient_id: follower.follower_id,
        sender_id: recipeId, // Hoặc id của người gửi thông báo
        type: 'new_recipe', // Loại thông báo, ví dụ: 'new_recipe'
        content: message,
        related_recipe_id: recipeId
      });
    }
    
    connection.release();
  } catch (error) {
    console.error('Error notifying followers:', error);
    if (connection) connection.release();
  }
};