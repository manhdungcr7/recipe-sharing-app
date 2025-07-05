const { pool } = require('../config/db');
const notificationController = require('./notificationController');

// Xóa công thức (dành cho admin)
exports.deleteRecipe = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    
    // Kiểm tra công thức có tồn tại không
    const [recipes] = await connection.query(
      'SELECT author_id, title FROM recipes WHERE id = ?',
      [id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }
    
    // Bắt đầu giao dịch
    await connection.beginTransaction();
    
    // Lấy thông tin tác giả và tiêu đề
    const authorId = recipes[0].author_id;
    const recipeTitle = recipes[0].title;
    
    // Xóa các bình luận
    await connection.query('DELETE FROM comments WHERE recipe_id = ?', [id]);
    
    // Xóa các tương tác
    await connection.query('DELETE FROM liked_recipes WHERE recipe_id = ?', [id]);
    await connection.query('DELETE FROM saved_recipes WHERE recipe_id = ?', [id]);
    
    // Xóa các báo cáo liên quan
    await connection.query('DELETE FROM reports WHERE (type = "recipe" AND reported_id = ?) OR recipe_id = ?', [id, id]);
    
    // Xóa các thành phần của công thức
    await connection.query('DELETE FROM ingredients WHERE recipe_id = ?', [id]); // Sửa từ recipe_ingredients thành ingredients
    await connection.query('DELETE FROM steps WHERE recipe_id = ?', [id]); // Sửa từ recipe_steps thành steps
    
    // Gửi thông báo cho tác giả TRƯỚC KHI xóa công thức
    const notificationData = {
      recipient_id: authorId,
      sender_id: req.user.id,
      type: 'moderation',
      content: `Công thức "${recipeTitle}" của bạn đã bị quản trị viên xóa do vi phạm quy định.`
      // Không thêm related_recipe_id vì công thức sẽ bị xóa
    };
    
    // Gửi thông báo TRƯỚC KHI xóa công thức
    await notificationController.createNotification(notificationData, connection);
    
    // Sau đó mới xóa công thức
    await connection.query('DELETE FROM recipes WHERE id = ?', [id]);
    
    // Hoàn thành giao dịch
    await connection.commit();
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa công thức và dữ liệu liên quan'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa công thức',
      error: error.message
    });
  }
};

// Lấy danh sách công thức (dành cho admin)
exports.getRecipes = async (req, res) => {
  let connection;
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;
    
    connection = await pool.getConnection();
    
    // Xây dựng câu truy vấn với điều kiện tìm kiếm
    let whereConditions = ['r.is_deleted = 0'];
    let queryParams = [];
    
    // Tìm kiếm theo từ khóa
    if (search) {
      // Kiểm tra xem search có phải là số (ID) không
      const isNumeric = /^\d+$/.test(search.trim());
      
      if (isNumeric) {
        // Nếu là số, tìm theo ID
        whereConditions.push('r.id = ?');
        queryParams.push(search.trim());
      } else {
        // Ngược lại, tìm theo tiêu đề hoặc tên tác giả
        whereConditions.push('(r.title LIKE ? OR u.name LIKE ?)');
        queryParams.push(`%${search}%`, `%${search}%`);
      }
    }
    
    // Lọc theo trạng thái
    if (status && status !== 'all') {
      whereConditions.push('r.status = ?');
      queryParams.push(status);
    }
    
    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Lấy danh sách công thức
    const [recipes] = await connection.query(
      `SELECT r.id, r.title, r.image_url, r.author_id, r.status, r.created_at, r.updated_at,
              u.name as author_name, u.picture as author_picture
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );
    
    // Đếm tổng số công thức
    const [totalRows] = await connection.query(
      `SELECT COUNT(*) as count
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       ${whereClause}`,
      queryParams
    );
    
    const totalRecipes = totalRows[0].count;
    const totalPages = Math.ceil(totalRecipes / limit);
    
    connection.release();
    
    res.status(200).json({
      success: true,
      data: recipes,
      pagination: {
        total: totalRecipes,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting recipes:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công thức',
      error: error.message
    });
  }
};