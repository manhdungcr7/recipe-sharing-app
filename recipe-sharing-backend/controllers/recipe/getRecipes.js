const { pool } = require('../../config/db');

/**
 * Lấy danh sách công thức với phân trang
 * @route   GET /api/recipes
 * @access  Public
 */
exports.getRecipes = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // Get published recipes with author info
    const [recipes] = await pool.query(
      `SELECT r.id, r.title, r.image_url, r.cooking_time, r.created_at,
              u.id as author_id, u.name as author_name, u.picture as author_picture,
              (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as like_count,
              (SELECT COUNT(*) FROM saves WHERE recipe_id = r.id) as save_count,
              (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id AND is_deleted = FALSE) as comment_count,
              r.shares, r.pdf_downloads
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       WHERE r.status = 'published' AND r.is_deleted = FALSE AND u.is_blocked = FALSE
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    // Get total count for pagination
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       WHERE r.status = 'published' AND r.is_deleted = FALSE AND u.is_blocked = FALSE`
    );
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      data: recipes,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
    
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Lấy tất cả công thức của người dùng
 * @route   GET /api/recipes/user/:userId
 * @access  Public
 */
exports.getUserRecipes = async (req, res) => {
  let connection;
  
  try {
    const userId = req.params.userId;
    const { status, sort } = req.query;
    
    console.log("Fetching recipes for user:", userId, "with status:", status || "all");
    
    connection = await pool.getConnection();
    
    let query = `SELECT r.*, u.name as author_name, u.picture as author_picture`;
    
    // Nếu cần thêm các trường khác
    if (status !== 'trash') {
      query += `, COUNT(DISTINCT lr.id) as likes_count, COUNT(DISTINCT sr.id) as saves_count`;
    }
    
    query += ` FROM recipes r JOIN users u ON r.author_id = u.id`;
    
    // Thêm LEFT JOIN nếu không phải trạng thái trash
    if (status !== 'trash') {
      query += ` LEFT JOIN liked_recipes lr ON r.id = lr.recipe_id
                LEFT JOIN saved_recipes sr ON r.id = sr.recipe_id`;
    }
    
    // XỬ LÝ TRẠNG THÁI TRASH - QUAN TRỌNG NHẤT
    if (status === 'trash') {
      query += ` WHERE r.author_id = ? AND r.is_deleted = 1`;
    } else {
      query += ` WHERE r.author_id = ? AND r.is_deleted = 0`;
      
      // Xử lý các trạng thái khác
      if (status && status !== 'all') {
        query += ` AND r.status = ?`;
      }
      
      // Nhóm theo ID nếu có count
      query += ` GROUP BY r.id`;
    }
    
    // Sắp xếp theo thời gian
    if (status === 'trash') {
      query += ` ORDER BY r.deleted_at DESC`;
    } else {
      query += ` ORDER BY r.created_at DESC`;
    }
    
    // SỬA Ở ĐÂY: Sử dụng mảng tham số phù hợp với truy vấn
    let params = [userId];
    if (status && status !== 'all' && status !== 'trash') {
      params.push(status);
    }
    
    // Thực thi query với đúng số lượng tham số
    const [recipes] = await connection.query(query, params);
    
    connection.release();
    
    res.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error('Error getting user recipes:', error);
    if (connection) connection.release();
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách công thức', 
      error: error.message 
    });
  }
};

/**
 * Lấy tất cả công thức đã lưu của người dùng hiện tại
 * @route   GET /api/recipes/saved
 * @access  Private
 */
exports.getSavedRecipes = async (req, res) => {
  try {
    // Kiểm tra người dùng đã đăng nhập
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để xem danh sách công thức đã lưu'
      });
    }
    
    const connection = await pool.getConnection();
    
    // Lấy danh sách công thức đã được lưu bởi người dùng hiện tại
    const [recipes] = await connection.query(
      `SELECT r.*, u.name as author_name, u.picture as author_picture 
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       JOIN saves s ON r.id = s.recipe_id
       WHERE s.user_id = ? AND r.is_deleted = 0 AND r.status = 'published'
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes
    });
    
  } catch (error) {
    console.error('Error getting saved recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách công thức đã lưu',
      error: error.message
    });
  }
};

/**
 * Lấy tất cả công thức của một người dùng
 * @route   GET /api/recipes/user/:userId/all
 * @access  Public
 */
exports.getAllRecipesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Getting ALL recipes for user ID:", userId);
    
    const connection = await pool.getConnection();
    
    // Truy vấn lấy tất cả công thức của user
    const [recipes] = await connection.query(
      `SELECT r.*, 
              COUNT(DISTINCT lr.id) as likes_count,
              COUNT(DISTINCT sr.id) as saves_count
       FROM recipes r
       LEFT JOIN liked_recipes lr ON r.id = lr.recipe_id
       LEFT JOIN saved_recipes sr ON r.id = sr.recipe_id
       WHERE r.author_id = ? AND r.is_deleted = 0
       GROUP BY r.id
       ORDER BY r.created_at DESC`, 
      [userId]
    );
    
    connection.release();
    
    res.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error('Error getting all user recipes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách công thức của người dùng', 
      error: error.message 
    });
    
    if (connection) connection.release();
  }
};

/**
 * Lấy tất cả công thức trong thùng rác của người dùng hiện tại
 * @route   GET /api/recipes/trashed
 * @access  Private
 */
exports.getTrashedRecipes = async (req, res) => {
  try {
    const userId = req.user.id;
    const connection = await pool.getConnection();
    const [recipes] = await connection.query(
      `SELECT * FROM recipes WHERE author_id = ? AND is_deleted = 1 ORDER BY deleted_at DESC`,
      [userId]
    );
    connection.release();
    res.json({ success: true, data: recipes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thùng rác', error: error.message });
  }
};