const { pool } = require('../config/db');

// Hàm tạo thông báo (để sử dụng trong các controller khác)
exports.createNotification = async (notificationData) => {
  let connection;
  try {
    const {
      recipient_id,
      sender_id,
      type,
      content,
      related_recipe_id = null,
      related_comment_id = null
    } = notificationData;

    connection = await pool.getConnection();

    await connection.query(
      `INSERT INTO notifications (recipient_id, sender_id, type, content, related_recipe_id, related_comment_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [recipient_id, sender_id, type, content, related_recipe_id, related_comment_id]
    );

    connection.release();
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    if (connection) connection.release();
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
    const { reply } = req.body;
    const userId = req.user.id;
    
    if (!reply) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung phản hồi không được để trống'
      });
    }
    
    connection = await pool.getConnection();
    
    // Kiểm tra thông báo có tồn tại và thuộc về người dùng không
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
    
    // Cập nhật phản hồi
    await connection.query(
      'UPDATE notifications SET user_reply = ?, replied_at = NOW() WHERE id = ?',
      [reply, id]
    );
    
    // Tạo thông báo cho admin
    const [admins] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    
    if (admins.length > 0) {
      await connection.query(
        `INSERT INTO notifications 
         (user_id, sender_id, type, title, content, reference_id, reference_type, created_at)
         VALUES (?, ?, 'user_reply', 'Phản hồi từ người dùng', ?, ?, 'notification', NOW())`,
        [admins[0].id, userId, reply, id]
      );
    }
    
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
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không được để trống'
      });
    }
    
    connection = await pool.getConnection();
    
    // Tìm admin để gửi thông báo
    const [admins] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    
    if (admins.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy admin để gửi tin nhắn'
      });
    }
    
    // Tạo thông báo cho admin
    await connection.query(
      `INSERT INTO notifications 
       (user_id, sender_id, type, title, content, created_at)
       VALUES (?, ?, 'user_message', 'Tin nhắn từ người dùng', ?, NOW())`,
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