const { pool } = require('../config/db');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    // Get user details
    const [users] = await pool.query(
      `SELECT id, name, email, picture, gender, role, created_at
       FROM users 
       WHERE id = ? AND is_blocked = FALSE`,
      [req.params.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // Đảm bảo trường picture luôn bắt đầu bằng dấu /
    if (user.picture && !user.picture.startsWith('http') && !user.picture.startsWith('/')) {
      user.picture = '/' + user.picture;
    }
    
    // Get follower and following counts
    const [followerResult] = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE followed_id = ?',
      [req.params.id]
    );
    
    const [followingResult] = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
      [req.params.id]
    );
    
    // Get recipe count
    const [recipesResult] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM recipes 
       WHERE author_id = ? AND status = 'published' AND is_deleted = FALSE`,
      [req.params.id]
    );
    
    // Check if current user follows this user
    let isFollowing = false;
    if (req.user) {
      const [followCheck] = await pool.query(
        'SELECT COUNT(*) as count FROM follows WHERE follower_id = ? AND followed_id = ?',
        [req.user.id, req.params.id]
      );
      isFollowing = followCheck[0].count > 0;
    }
    
    // Get user's published recipes
    const [recipes] = await pool.query(
      `SELECT id, title, image_url, cooking_time, created_at,
              (SELECT COUNT(*) FROM liked_recipes WHERE recipe_id = recipes.id) as like_count,
              (SELECT COUNT(*) FROM comments WHERE recipe_id = recipes.id AND is_deleted = FALSE) as comment_count
       FROM recipes
       WHERE author_id = ? AND status = 'published' AND is_deleted = FALSE
       ORDER BY created_at DESC
       LIMIT 6`,
      [req.params.id]
    );
    
    user.followerCount = followerResult[0].count;
    user.followingCount = followingResult[0].count;
    user.recipeCount = recipesResult[0].count;
    user.isFollowing = isFollowing;
    user.recentRecipes = recipes;
    
    res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
exports.updateProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  try {
    const { name } = req.body;
    const userId = req.user.id;
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE users SET name = ? WHERE id = ?',
      [name, userId]
    );
    connection.release();
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: { name }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Follow/Unfollow a user
// @route   POST /api/users/:id/follow
// @access  Private
exports.followUser = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Can't follow yourself
    if (req.user.id == req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }
    
    // Check if user exists
    const [users] = await connection.query(
      'SELECT id, name FROM users WHERE id = ? AND is_blocked = FALSE',
      [req.params.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const targetUser = users[0];
    
    // Check if already following
    const [existingFollow] = await connection.query(
      'SELECT * FROM follows WHERE follower_id = ? AND followed_id = ?',
      [req.user.id, req.params.id]
    );
    
    if (existingFollow.length > 0) {
      // Already following, so unfollow
      await connection.query(
        'DELETE FROM follows WHERE follower_id = ? AND followed_id = ?',
        [req.user.id, req.params.id]
      );
      
      await connection.commit();
      
      return res.status(200).json({
        success: true,
        data: {
          following: false,
          message: 'User unfollowed successfully'
        }
      });
    }
    
    // Not following yet, so follow
    await connection.query(
      'INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)',
      [req.user.id, req.params.id]
    );
    
    // Create notification
    await connection.query(
      `INSERT INTO notifications (recipient_id, sender_id, type, content)
       VALUES (?, ?, 'follow', ?)`,
      [
        req.params.id,
        req.user.id,
        `${req.user.name} started following you`
      ]
    );
    
    await connection.commit();
    
    res.status(200).json({
      success: true,
      data: {
        following: true,
        message: 'User followed successfully'
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    connection.release();
  }
};

// @desc    Upload user avatar
// @route   POST /api/users/upload-avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    // Kiểm tra user đã đăng nhập
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để thực hiện chức năng này'
      });
    }
    
    // Kiểm tra nếu không có file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được upload'
      });
    }
    
    // Lấy đường dẫn file đã upload
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    
    // Cập nhật avatarPath trong database
    const connection = await pool.getConnection();
    await connection.query('UPDATE users SET picture = ? WHERE id = ?', [avatarPath, req.user.id]);
    connection.release();
    
    // Trả về kết quả thành công
    res.status(200).json({
      success: true,
      message: 'Upload avatar thành công',
      data: {
        picture: avatarPath
      }
    });
    
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload avatar',
      error: error.message
    });
  }
};

// @desc    Get user recipes
// @route   GET /api/users/:userId/recipes
// @access  Public
exports.getUserRecipes = async (req, res) => {
  const userId = req.params.userId;
  const status = req.query.status || 'published';
  const connection = await pool.getConnection();
  try {
    let query, params;
    
    if (status === 'trash') {
      // Khi status=trash, lấy các công thức đã bị xóa (is_deleted = 1)
      query = 'SELECT * FROM recipes WHERE author_id = ? AND is_deleted = 1 ORDER BY deleted_at DESC';
      params = [userId];
    } else {
      // Các trường hợp khác, lấy công thức chưa bị xóa (is_deleted = 0)
      query = 'SELECT * FROM recipes WHERE author_id = ? AND is_deleted = 0';
      params = [userId];
      if (status && status !== 'all') {
        query += ' AND status = ?';
        params.push(status);
      }
      query += ' ORDER BY created_at DESC';
    }
    
    const [recipes] = await connection.query(query, params);
    connection.release();
    res.json({ success: true, data: recipes });
  } catch (error) {
    connection.release();
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách công thức', error: error.message });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Public
exports.getUserStats = async (req, res) => {
  const userId = req.params.id;
  const connection = await pool.getConnection();
  try {
    // Số người theo dõi
    const [[{ followerCount }]] = await connection.query(
      'SELECT COUNT(*) as followerCount FROM follows WHERE followed_id = ?', [userId]
    );
    // Số người đang theo dõi
    const [[{ followingCount }]] = await connection.query(
      'SELECT COUNT(*) as followingCount FROM follows WHERE follower_id = ?', [userId]
    );
    // Số bài đăng đã đăng
    const [[{ publishedCount }]] = await connection.query(
      'SELECT COUNT(*) as publishedCount FROM recipes WHERE author_id = ? AND status = "published" AND is_deleted = 0', [userId]
    );
    // Tổng lượt thích (đếm từ bảng liked_recipes)
    const [[{ totalLikes }]] = await connection.query(
      `SELECT COUNT(*) as totalLikes FROM liked_recipes lr
       JOIN recipes r ON lr.recipe_id = r.id
       WHERE r.author_id = ? AND r.status = "published" AND r.is_deleted = 0`, [userId]
    );
    // Tổng lượt chia sẻ (nếu có cột share_count thì giữ nguyên, nếu không thì cho = 0)
    const totalShares = 0; // hoặc sửa lại nếu bạn có bảng lưu lượt chia sẻ
    // Tổng lượt lưu (đếm từ bảng saved_recipes)
    const [[{ totalSaves }]] = await connection.query(
      `SELECT COUNT(*) as totalSaves FROM saved_recipes sr
       JOIN recipes r ON sr.recipe_id = r.id
       WHERE r.author_id = ? AND r.status = "published" AND r.is_deleted = 0`, [userId]
    );
    connection.release();
    res.json({
      success: true,
      data: { followerCount, followingCount, publishedCount, totalLikes, totalShares, totalSaves }
    });
  } catch (error) {
    connection.release();
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê', error: error.message });
  }
};

exports.getFollowers = async (req, res) => {
  const userId = req.params.id;
  const connection = await pool.getConnection();
  try {
    const [followers] = await connection.query(
      `SELECT u.id, u.name, u.picture FROM follows f JOIN users u ON f.follower_id = u.id WHERE f.followed_id = ?`, [userId]
    );
    connection.release();
    res.json({ success: true, data: followers });
  } catch (error) {
    connection.release();
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách follower', error: error.message });
  }
};

exports.getFollowing = async (req, res) => {
  const userId = req.params.id;
  const connection = await pool.getConnection();
  try {
    const [following] = await connection.query(
      `SELECT u.id, u.name, u.picture FROM follows f JOIN users u ON f.followed_id = u.id WHERE f.follower_id = ?`, [userId]
    );
    connection.release();
    res.json({ success: true, data: following });
  } catch (error) {
    connection.release();
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách following', error: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res) => {
  const userId = req.params.id;
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.query(
      'SELECT id, name, email, picture, role FROM users WHERE id = ?',
      [userId]
    );
    connection.release();
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    res.json({ success: true, data: users[0] });
  } catch (error) {
    connection.release();
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// More controller methods would be implemented here