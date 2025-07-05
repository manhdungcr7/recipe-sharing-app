const { pool } = require('../config/db');

// Lấy danh sách báo cáo (dành cho admin)
exports.getReports = async (req, res) => {
  let connection;
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    console.log('Fetching reports with:', { page, limit, status, type, search });
    
    // Thêm dòng này để tính offset
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    connection = await pool.getConnection();
    
    // Xây dựng câu truy vấn với các điều kiện lọc
    let query = `
      SELECT r.id, r.reported_id, r.reporter_id, r.type, r.reason, 
             r.description, r.status, r.resource_title, r.recipe_id, 
             r.admin_id, r.admin_response, r.created_at, r.updated_at,
             u1.name as reporter_name
      FROM reports r
      INNER JOIN users u1 ON r.reporter_id = u1.id
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
    queryParams.push(parseInt(limit), offset); // offset đã được định nghĩa ở trên
    
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
    console.error('Detailed error in getReports:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách báo cáo',
      error: error.message
    });
  }
};

// Lấy chi tiết báo cáo (dành cho admin)
exports.getReport = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    
    // Lấy thông tin báo cáo cơ bản
    const [reports] = await connection.query(
      `SELECT r.*, 
              reporter.name as reporter_name,
              reporter.email as reporter_email
       FROM reports r
       JOIN users reporter ON r.reporter_id = reporter.id
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
    
    const report = reports[0];
    
    // Bổ sung thông tin dựa trên loại báo cáo
    switch(report.type) {
      case 'user':
        // Thêm thông tin người dùng bị báo cáo
        const [reportedUsers] = await connection.query(
          'SELECT name as reported_user_name, email as reported_user_email FROM users WHERE id = ?',
          [report.reported_id]
        );
        
        if (reportedUsers.length > 0) {
          Object.assign(report, reportedUsers[0]);
        }
        break;
        
      case 'comment':
        // Thêm thông tin comment và người viết comment
        const [commentInfo] = await connection.query(
          `SELECT c.text as comment_text, 
                  c.user_id as comment_author_id,
                  u.name as comment_author_name,
                  c.recipe_id,
                  r.title as recipe_title
           FROM comments c
           JOIN users u ON c.user_id = u.id
           JOIN recipes r ON c.recipe_id = r.id
           WHERE c.id = ?`,
          [report.reported_id]
        );
        
        if (commentInfo.length > 0) {
          Object.assign(report, commentInfo[0]);
        }
        break;
        
      case 'recipe':
        // Thêm thông tin recipe và người đăng recipe
        const [recipeInfo] = await connection.query(
          `SELECT r.title as recipe_title,
                  r.author_id as recipe_author_id,
                  u.name as recipe_author_name
           FROM recipes r
           JOIN users u ON r.author_id = u.id
           WHERE r.id = ?`,
          [report.reported_id]
        );
        
        if (recipeInfo.length > 0) {
          Object.assign(report, recipeInfo[0]);
        }
        break;
    }
    
    connection.release();
    
    res.status(200).json({
      success: true,
      data: report
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
      `INSERT INTO notifications (recipient_id, type, content, sender_id, created_at)
       VALUES (?, 'moderation', ?, ?, NOW())`,
      [report.reporter_id, response, adminId]
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