const { pool } = require('../config/db');
const notificationController = require('./notificationController');

// Khóa tài khoản người dùng
exports.suspendUser = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { days, reason, isPermanent } = req.body;
    const adminId = req.user.id;
    
    // Kiểm tra đầu vào
    if (!isPermanent && (!days || isNaN(days) || days <= 0 || days > 365)) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian khóa không hợp lệ'
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
    
    // Cập nhật trạng thái tài khoản
    if (isPermanent) {
      // Khóa vĩnh viễn = block_expiry NULL và is_blocked = 1
      await connection.query(
        'UPDATE users SET is_blocked = 1, block_reason = ?, block_expiry = NULL WHERE id = ?',
        [reason, id]
      );
    } else {
      // Khóa có thời hạn
      const blockExpiry = new Date();
      blockExpiry.setDate(blockExpiry.getDate() + parseInt(days));
      
      await connection.query(
        'UPDATE users SET is_blocked = 1, block_reason = ?, block_expiry = ? WHERE id = ?',
        [reason, blockExpiry, id]
      );
    }
    
    // Gửi thông báo cho người dùng
    const notificationData = {
      recipient_id: id,
      sender_id: adminId,
      type: 'moderation', // Thay thế bằng giá trị hợp lệ
      content: isPermanent 
        ? `Tài khoản của bạn đã bị khóa vĩnh viễn. Lý do: ${reason || 'Vi phạm quy định'}`
        : `Tài khoản của bạn đã bị khóa ${days} ngày. Lý do: ${reason || 'Vi phạm quy định'}`
      // Loại bỏ các trường không được sử dụng
    };
    
    await notificationController.createNotification(notificationData);
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: isPermanent ? 'Đã khóa vĩnh viễn tài khoản người dùng' : `Đã khóa tài khoản người dùng ${days} ngày`
    });
  } catch (error) {
    console.error('Error blocking user:', error);
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

// Lấy danh sách người dùng
exports.getUsers = async (req, res) => {
  let connection;
  try {
    const { page = 1, limit = 10, sort, role, search, id } = req.query;
    
    connection = await pool.getConnection();
    
    // Kiểm tra nếu có id parameter và in ra log để debug
    console.log("ID parameter:", id, typeof id);
    
    // Xử lý đặc biệt khi tìm theo ID
    if (id) {
      console.log("Searching by ID:", id);
      
      // Tìm chính xác người dùng có id cụ thể
      const [users] = await connection.query(
        'SELECT id, name, email, role, picture, is_blocked, block_expiry, is_verified, created_at FROM users WHERE id = ?',
        [id]
      );
      
      connection.release();
      
      console.log("Found users by ID:", users.length);
      
      return res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total: users.length,
          totalPages: 1,
          currentPage: 1,
          limit: users.length
        }
      });
    }
    
    // Phần code hiện tại cho trường hợp không tìm theo ID
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    
    // Tìm kiếm theo tên hoặc email
    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Lọc theo vai trò
    if (role && role !== 'all') {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }
    
    // Tạo WHERE clause
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Xác định sắp xếp
    let orderClause = 'ORDER BY created_at DESC';
    if (sort === 'oldest') orderClause = 'ORDER BY created_at ASC';
    else if (sort === 'name') orderClause = 'ORDER BY name ASC';
    
    // Truy vấn danh sách người dùng
    const [users] = await connection.query(
      `SELECT id, name, email, role, picture, is_blocked, block_expiry, created_at 
       FROM users ${whereClause} ${orderClause}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );
    
    // Đếm tổng số người dùng
    const [totalRows] = await connection.query(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      queryParams
    );
    
    connection.release();
    
    const totalUsers = totalRows[0].count;
    const totalPages = Math.ceil(totalUsers / limit);
    
    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: totalUsers,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng',
      error: error.message
    });
  }
};

// Gỡ khóa tài khoản người dùng
exports.unsuspendUser = async (req, res) => {
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
    
    // Kiểm tra xem tài khoản có bị khóa không
    if (!users[0].is_blocked) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này không bị khóa'
      });
    }
    
    // Cập nhật trạng thái tài khoản
    await connection.query(
      'UPDATE users SET is_blocked = 0, block_reason = NULL, block_expiry = NULL WHERE id = ?',
      [id]
    );
    
    // Gửi thông báo cho người dùng
    const notificationData = {
      recipient_id: id,
      sender_id: adminId,
      type: 'moderation',
      content: 'Tài khoản của bạn đã được gỡ khóa. Bây giờ bạn có thể sử dụng đầy đủ tính năng trên hệ thống.'
    };
    
    await notificationController.createNotification(notificationData);
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã gỡ khóa tài khoản người dùng'
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gỡ khóa tài khoản người dùng',
      error: error.message
    });
  }
};