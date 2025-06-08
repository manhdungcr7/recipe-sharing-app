const { pool } = require('../../config/db');

/**
 * Lấy chi tiết công thức theo ID
 * @route   GET /api/recipes/:id
 * @access  Public
 */
exports.getRecipeById = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Lấy thông tin công thức
    const [recipes] = await connection.query(
      `SELECT r.id, r.title, r.image_url, r.cooking_time, r.thoughts, 
              r.status, r.created_at, r.updated_at, r.author_id,
              u.name as author_name, u.picture as author_picture
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       WHERE r.id = ? AND r.is_deleted = 0`,
      [req.params.id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }
    
    const recipe = recipes[0];
    
    // Kiểm tra quyền truy cập với công thức chưa được xuất bản
    if (recipe.status !== 'published') {
      const isAuthor = req.user && req.user.id === recipe.author_id;
      const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'moderator');
      
      if (!isAuthor && !isAdmin) {
        connection.release();
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập công thức này'
        });
      }
    }
    
    // Lấy nguyên liệu
    const [ingredients] = await connection.query(
      'SELECT id, name, quantity, unit FROM ingredients WHERE recipe_id = ?',
      [req.params.id]
    );
    
    // Get steps với image_url
    const [steps] = await connection.query(
      'SELECT id, description, image_url, order_index FROM steps WHERE recipe_id = ? ORDER BY order_index ASC',
      [req.params.id]
    );
    
    // Lấy số lượng likes, saves
    const [likesCount] = await connection.query(
      'SELECT COUNT(*) as count FROM liked_recipes WHERE recipe_id = ?',
      [req.params.id]
    );
    
    const [savesCount] = await connection.query(
      'SELECT COUNT(*) as count FROM saved_recipes WHERE recipe_id = ?',
      [req.params.id]
    );
    
    // Kiểm tra người dùng hiện tại đã like, save chưa
    let isLiked = false;
    let isSaved = false;
    
    if (req.user) {
      const [likedResult] = await connection.query(
        'SELECT id FROM liked_recipes WHERE recipe_id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      
      const [savedResult] = await connection.query(
        'SELECT id FROM saved_recipes WHERE recipe_id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      
      isLiked = likedResult.length > 0;
      isSaved = savedResult.length > 0;
    }
    
    // Đính kèm dữ liệu bổ sung vào đối tượng công thức
    recipe.ingredients = ingredients;
    recipe.steps = steps;
    recipe.likes_count = likesCount[0].count;
    recipe.saves_count = savesCount[0].count;
    recipe.is_liked = isLiked;
    recipe.is_saved = isSaved;
    
    connection.release();
    
    res.json({
      success: true,
      data: recipe
    });
    
  } catch (error) {
    console.error('Error getting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin công thức',
      error: error.message
    });
  }
};

/**
 * Xem chi tiết công thức (implementation cũ)
 * @route   GET /api/recipes/:id/detail
 * @access  Public
 */
exports.getRecipe = async (req, res) => {
  const { id } = req.params;
  console.log(`Getting recipe with ID: ${id}`);
  
  try {
    const connection = await pool.getConnection();
    
    // Truy vấn dữ liệu với ID
    console.log(`Executing query for recipe ID: ${id}`);
    const [recipes] = await connection.query(
      `SELECT r.*, u.name as author_name, u.picture as author_picture
       FROM recipes r
       LEFT JOIN users u ON r.author_id = u.id 
       WHERE r.id = ? AND r.is_deleted = 0`,
      [id]
    );
    
    // Kiểm tra có tìm thấy công thức không
    if (recipes.length === 0) {
      console.log(`Recipe with ID ${id} not found`);
      connection.release();
      return res.status(404).json({
        success: false,
        message: `Recipe with ID ${id} not found`
      });
    }
    
    const recipe = recipes[0];
    
    // Lấy danh sách nguyên liệu
    const [ingredients] = await connection.query(
      `SELECT * FROM ingredients WHERE recipe_id = ?`,
      [id]
    );
    recipe.ingredients = ingredients;
    
    // Lấy các bước thực hiện
    const [steps] = await connection.query(
      `SELECT * FROM steps WHERE recipe_id = ? ORDER BY order_index`,
      [id]
    );
    recipe.steps = steps;
    
    // Thêm thông tin tương tác của người dùng hiện tại
    if (req.user) {
      const userId = req.user.id;
      
      const [userInteractions] = await connection.query(
        `SELECT 
          (SELECT COUNT(*) FROM likes WHERE recipe_id = ? AND user_id = ?) as liked,
          (SELECT COUNT(*) FROM saves WHERE recipe_id = ? AND user_id = ?) as saved
        `,
        [id, userId, id, userId]
      );
      
      recipe.userInteraction = {
        liked: userInteractions[0].liked > 0,
        saved: userInteractions[0].saved > 0
      };
    }
    
    // Thêm số lượt thích, lưu, chia sẻ
    const [interactions] = await connection.query(
      `SELECT 
        (SELECT COUNT(*) FROM likes WHERE recipe_id = ?) as likesCount,
        (SELECT COUNT(*) FROM saves WHERE recipe_id = ?) as savesCount
      `,
      [id, id]
    );
    
    recipe.likesCount = interactions[0].likesCount;
    recipe.savesCount = interactions[0].savesCount;
    
    connection.release();
    
    console.log(`Successfully retrieved recipe with ID ${id}`);
    return res.status(200).json({
      success: true,
      data: recipe
    });
    
  } catch (error) {
    console.error(`Error getting recipe with ID ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Server error when getting recipe',
      error: error.message
    });
  }
};