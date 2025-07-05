const { pool } = require('../../config/db');
const notificationController = require('../notificationController');

/**
 * Like công thức
 * @route   POST /api/recipes/:id/like
 * @access  Private
 */
exports.likeRecipe = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    connection = await pool.getConnection();
    
    // Kiểm tra xem công thức có tồn tại không
    const [recipes] = await connection.query(
      'SELECT * FROM recipes WHERE id = ? AND is_deleted = 0',
      [id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }
    
    // Kiểm tra xem đã like chưa
    const [likes] = await connection.query(
      'SELECT * FROM likes WHERE recipe_id = ? AND user_id = ?',
      [id, userId]
    );
    
    // Nếu đã like, thì unlike
    if (likes.length > 0) {
      await connection.query(
        'DELETE FROM likes WHERE recipe_id = ? AND user_id = ?',
        [id, userId]
      );
      
      // Đếm số lượng like hiện tại
      const [likesCount] = await connection.query(
        'SELECT COUNT(*) as count FROM likes WHERE recipe_id = ?',
        [id]
      );
      
      connection.release();
      
      return res.status(200).json({
        success: true,
        liked: false,
        likesCount: likesCount[0].count,
        message: 'Đã bỏ thích công thức'
      });
    }
    
    // Nếu chưa like, thì thêm like
    await connection.query(
      'INSERT INTO likes (recipe_id, user_id, created_at) VALUES (?, ?, NOW())',
      [id, userId]
    );
    
    // Đếm số lượng like hiện tại
    const [likesCount] = await connection.query(
      'SELECT COUNT(*) as count FROM likes WHERE recipe_id = ?',
      [id]
    );
    
    // Tạo thông báo cho tác giả nếu người like khác tác giả
    const recipeAuthorId = recipes[0].author_id;
    if (recipeAuthorId !== userId) {
      // Gọi hàm tạo thông báo (nếu có)
      try {
        await notificationController.createLikeNotification(
          userId,
          recipeAuthorId,
          id,
          recipes[0].title
        );
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }
    
    connection.release();
    
    res.status(200).json({
      success: true,
      liked: true,
      likesCount: likesCount[0].count,
      message: 'Đã thích công thức'
    });
    
  } catch (error) {
    console.error('Like recipe error:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thích công thức',
      error: error.message
    });
  }
};

/**
 * Lưu công thức
 * @route   POST /api/recipes/:id/save
 * @access  Private
 */
exports.saveRecipe = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    connection = await pool.getConnection();
    
    // Kiểm tra xem công thức có tồn tại không
    const [recipes] = await connection.query(
      'SELECT * FROM recipes WHERE id = ? AND is_deleted = 0',
      [id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }
    
    // Kiểm tra xem đã lưu chưa
    const [saved] = await connection.query(
      'SELECT * FROM saved_recipes WHERE recipe_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (saved.length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Công thức này đã được lưu trước đó'
      });
    }
    
    // Lưu công thức
    await connection.query(
      'INSERT INTO saved_recipes (recipe_id, user_id, created_at) VALUES (?, ?, NOW())',
      [id, userId]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã lưu công thức'
    });
    
  } catch (error) {
    console.error('Save recipe error:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu công thức',
      error: error.message
    });
  }
};

/**
 * Bỏ lưu công thức
 * @route   DELETE /api/recipes/:id/save
 * @access  Private
 */
exports.unsaveRecipe = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    connection = await pool.getConnection();
    
    // Kiểm tra xem đã lưu chưa
    const [saved] = await connection.query(
      'SELECT * FROM saved_recipes WHERE recipe_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (saved.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Công thức này chưa được lưu'
      });
    }
    
    // Bỏ lưu công thức
    await connection.query(
      'DELETE FROM saved_recipes WHERE recipe_id = ? AND user_id = ?',
      [id, userId]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Đã bỏ lưu công thức'
    });
    
  } catch (error) {
    console.error('Unsave recipe error:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi bỏ lưu công thức',
      error: error.message
    });
  }
};

/**
 * Chia sẻ công thức
 * @route   POST /api/recipes/:id/share
 * @access  Private
 */
exports.shareRecipe = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    connection = await pool.getConnection();
    
    // Kiểm tra xem công thức có tồn tại không
    const [recipes] = await connection.query(
      'SELECT * FROM recipes WHERE id = ? AND is_deleted = 0',
      [id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }
    
    // Ghi nhận lượt chia sẻ (nếu có bảng shares)
    try {
      await connection.query(
        'INSERT INTO shares (recipe_id, user_id, created_at) VALUES (?, ?, NOW())',
        [id, userId]
      );
    } catch (error) {
      console.log('Bảng shares chưa được tạo, bỏ qua:', error.message);
    }
    
    connection.release();
    
    // Tạo URL chia sẻ
    const shareUrl = `http://localhost:5001/recipe/${id}`;
    
    res.status(200).json({
      success: true,
      message: 'Đã chia sẻ công thức',
      shareUrl
    });
    
  } catch (error) {
    console.error('Share recipe error:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi chia sẻ công thức',
      error: error.message
    });
  }
};

/**
 * Xuất công thức ra PDF
 * @route   GET /api/recipes/:id/pdf
 * @access  Public
 */
exports.exportRecipeToPDF = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();
    
    // Lấy thông tin công thức
    const [recipes] = await connection.query(
      `SELECT r.*, u.name as author_name 
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       WHERE r.id = ? AND r.is_deleted = 0`,
      [id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }
    
    const recipe = recipes[0];
    
    // Lấy nguyên liệu
    const [ingredients] = await connection.query(
      'SELECT * FROM ingredients WHERE recipe_id = ?',
      [id]
    );
    
    // Lấy các bước thực hiện
    const [steps] = await connection.query(
      'SELECT * FROM steps WHERE recipe_id = ? ORDER BY order_index',
      [id]
    );
    
    connection.release();
    
    // Trong thực tế, ở đây sẽ có code tạo file PDF
    // Nhưng hiện tại chỉ trả về thông tin để triển khai sau
    res.status(200).json({
      success: true,
      message: 'Chức năng xuất PDF đang được phát triển',
      data: {
        recipe,
        ingredients,
        steps
      }
    });
    
  } catch (error) {
    console.error('Export recipe to PDF error:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xuất công thức ra PDF',
      error: error.message
    });
  }
};