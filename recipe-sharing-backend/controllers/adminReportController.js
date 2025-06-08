const { pool } = require('../config/db');

// Lấy danh sách báo cáo (dành cho admin)
exports.getReports = async (req, res) => {
  let connection;
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    const offset = (page - 1) * limit;
    
    connection = await pool.getConnection();
    
    // Xây dựng câu truy vấn với các điều kiện lọc
    let query = `
      SELECT r.*, 
             u1.name as reporter_name, 
             CASE 
               WHEN r.type = 'user' THEN u2.name 
               WHEN r.type = 'recipe' THEN rc.title 
               WHEN r.type = 'comment' THEN c.text
             END as resource_title
       FROM reports r
       INNER JOIN users u1 ON r.reporter_id = u1.id
       LEFT JOIN users u2 ON (r.type = 'user' AND r.reported_id = u2.id)
       LEFT JOIN recipes rc ON (r.type = 'recipe' AND r.reported_id = rc.id)
       LEFT JOIN comments c ON (r.type = 'comment' AND r.reported_id = c.id)
       WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Thêm điều kiện lọc theo trạng thái
    if (status && status !== 'all') {
      query += ' AND r.status = ?';
      queryParams.push(status);
    }
    
    // Thêm điều kiện lọc theo loại báo cáo
    if (type && type !== 'all') {
      query += ' AND r.type = ?';
      queryParams.push(type);
    }
    
    // Thêm điều kiện tìm kiếm
    if (search) {
      query += ` AND (
        r.id LIKE ? OR 
        u1.name LIKE ? OR 
        r.reason LIKE ? OR 
        r.details LIKE ? OR 
        r.resource_title LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // Đếm tổng số báo cáo
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM (${query}) as subquery`, 
      queryParams
    );
    const total = countResult[0].total;
    
    // Sắp xếp và phân trang
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const [reports] = await connection.query(query, queryParams);
    
    connection.release();
    
    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách báo cáo',
      error: error.message
    });
  }
};

// Lấy chi tiết báo cáo (dành cho admin)
exports.getReportDetail = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    
    const [reports] = await connection.query(
      `SELECT r.*, 
             u1.name as reporter_name,
             u1.email as reporter_email,
             CASE 
               WHEN r.type = 'user' THEN u2.name 
               WHEN r.type = 'recipe' THEN rc.title 
               WHEN r.type = 'comment' THEN c.text
             END as resource_title
       FROM reports r
       INNER JOIN users u1 ON r.reporter_id = u1.id
       LEFT JOIN users u2 ON (r.type = 'user' AND r.reported_id = u2.id)
       LEFT JOIN recipes rc ON (r.type = 'recipe' AND r.reported_id = rc.id)
       LEFT JOIN comments c ON (r.type = 'comment' AND r.reported_id = c.id)
       WHERE r.id = ?`,
      [id]
    );
    
    if (reports.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo'
      });
    }
    
    connection.release();
    
    res.status(200).json({
      success: true,
      data: reports[0]
    });
  } catch (error) {
    console.error('Error getting report details:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin báo cáo',
      error: error.message
    });
  }
};

// Cập nhật trạng thái báo cáo
exports.updateReportStatus = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'investigating', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    connection = await pool.getConnection();
    
    // Kiểm tra báo cáo có tồn tại không
    const [reports] = await connection.query('SELECT * FROM reports WHERE id = ?', [id]);
    
    if (reports.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo'
      });
    }
    
    // Cập nhật trạng thái
    await connection.query(
      'UPDATE reports SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái báo cáo thành ${status}`
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái báo cáo',
      error: error.message
    });
  }
};

// Phản hồi báo cáo
exports.respondToReport = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { response } = req.body;
    const adminId = req.user.id;
    
    if (!response || !response.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung phản hồi không được để trống'
      });
    }
    
    connection = await pool.getConnection();
    
    // Kiểm tra báo cáo có tồn tại không
    const [reports] = await connection.query(
      'SELECT * FROM reports WHERE id = ?',
      [id]
    );
    
    if (reports.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo'
      });
    }
    
    const report = reports[0];
    
    // Cập nhật báo cáo với phản hồi của admin
    await connection.query(
      'UPDATE reports SET admin_response = ?, admin_id = ?, updated_at = NOW() WHERE id = ?',
      [response, adminId, id]
    );
    
    // Tạo thông báo cho người báo cáo
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, content, related_id, sender_id, created_at)
       VALUES (?, 'report_response', 'Phản hồi báo cáo của bạn', ?, ?, ?, NOW())`,
      [report.reporter_id, response, id, adminId]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã gửi phản hồi thành công'
    });
  } catch (error) {
    console.error('Error responding to report:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi phản hồi',
      error: error.message
    });
  }
};