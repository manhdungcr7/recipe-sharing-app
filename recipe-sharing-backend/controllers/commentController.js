const { pool } = require('../config/db');
const notificationController = require('./notificationController');

// @desc    Get comments for a recipe
// @route   GET /api/comments/recipe/:recipeId
// @access  Public
// Cần kiểm tra query SQL trong phương thức này
exports.getRecipeComments = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const connection = await pool.getConnection();
    
    // Lấy tất cả comments gốc (không có parent)
    const [rootComments] = await connection.query(
      `SELECT c.*, u.name as user_name, u.picture as user_picture
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.recipe_id = ? AND c.parent_id IS NULL
       ORDER BY c.created_at DESC`,
      [recipeId]
    );
    
    // Lấy tất cả replies cho recipe này (lấy một lần để tránh N+1 queries)
    const [allReplies] = await connection.query(
      `SELECT r.*, u.name as user_name, u.picture as user_picture
       FROM comments r
       JOIN users u ON r.user_id = u.id
       WHERE r.recipe_id = ? AND r.parent_id IS NOT NULL
       ORDER BY r.created_at ASC`,
      [recipeId]
    );
    
    // Tạo map để tìm kiếm nhanh các replies theo parent_id
    const repliesByParentId = {};
    allReplies.forEach(reply => {
      if (!repliesByParentId[reply.parent_id]) {
        repliesByParentId[reply.parent_id] = [];
      }
      repliesByParentId[reply.parent_id].push(reply);
    });
    
    // Đệ quy để xây dựng cây comments
    function attachReplies(comments) {
      comments.forEach(comment => {
        comment.replies = repliesByParentId[comment.id] || [];
        // Đệ quy cho các replies
        if (comment.replies.length > 0) {
          attachReplies(comment.replies);
        }
      });
    }
    
    // Đính kèm replies vào comments gốc
    attachReplies(rootComments);
    
    connection.release();
    
    res.status(200).json({
      success: true,
      count: rootComments.length,
      data: rootComments
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false, 
      message: 'Lỗi server khi lấy bình luận',
      error: error.message
    });
  }
};

// @desc    Create a comment
// @route   POST /api/comments/recipe/:recipeId
// @access  Private
exports.createComment = async (req, res) => {
  try {
    // Kiểm tra user đã đăng nhập
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để bình luận'
      });
    }
    
    const { recipeId } = req.params;
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không được để trống'
      });
    }
    
    const connection = await pool.getConnection();
    
    // Kiểm tra recipe có tồn tại
    const [recipes] = await connection.query(
      'SELECT id, author_id, title FROM recipes WHERE id = ?',
      [recipeId]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức'
      });
    }
    
    const recipeAuthorId = recipes[0].author_id;
    const recipeTitle = recipes[0].title;
    const userId = req.user.id;
    const userName = req.user.name;
    
    // Thêm comment mới
    const [result] = await connection.query(
      'INSERT INTO comments (text, user_id, recipe_id) VALUES (?, ?, ?)',
      [text, req.user.id, recipeId]
    );
    
    // Lấy comment vừa tạo kèm thông tin người dùng
    const [comments] = await connection.query(
      `SELECT c.*, u.name as user_name, u.picture as user_picture
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );
    
    // Gửi notification cho tác giả công thức nếu người bình luận không phải là tác giả
    if (recipeAuthorId !== userId) {
      await notificationController.createNotification({
        recipient_id: recipeAuthorId,      // ĐÚNG: người nhận thông báo
        sender_id: userId,                 // người bình luận
        type: 'comment',
        content: `${userName} đã bình luận về công thức "${recipeTitle}" của bạn.`,
        related_recipe_id: recipeId,
        related_comment_id: result.insertId
      });
    }
    
    connection.release();
    
    res.status(201).json({
      success: true,
      message: 'Đã thêm bình luận thành công',
      data: comments[0]
    });
    
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo bình luận',
      error: error.message
    });
  }
};

// @desc    Create a reply to a comment
// @route   POST /api/comments/:commentId/reply
// @access  Private
exports.replyToComment = async (req, res) => {
  try {
    // Kiểm tra user đã đăng nhập
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để trả lời bình luận'
      });
    }
    
    const { commentId } = req.params;
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nội dung trả lời không được để trống'
      });
    }
    
    const connection = await pool.getConnection();
    
    // Kiểm tra comment có tồn tại
    const [comments] = await connection.query(
      'SELECT * FROM comments WHERE id = ?',
      [commentId]
    );
    
    if (comments.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }
    
    const parentComment = comments[0];
    const parentCommentUserId = parentComment.user_id;
    const userId = req.user.id;
    const userName = req.user.name;
    const recipeId = parentComment.recipe_id;
    
    // Thêm reply mới
    const [result] = await connection.query(
      'INSERT INTO comments (text, user_id, recipe_id, parent_id) VALUES (?, ?, ?, ?)',
      [text, req.user.id, parentComment.recipe_id, commentId]
    );
    
    // Lấy reply vừa tạo kèm thông tin người dùng
    const [replies] = await connection.query(
      `SELECT r.*, u.name as user_name, u.picture as user_picture
       FROM comments r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );
    
    // Sau khi lưu reply vào DB:
    if (parentCommentUserId !== userId) {
      await notificationController.createNotification({
        recipient_id: parentCommentUserId, // ĐÚNG: người nhận thông báo
        sender_id: userId,                 // người trả lời
        type: 'reply',
        content: `${userName} đã trả lời bình luận của bạn.`,
        related_recipe_id: recipeId,
        related_comment_id: result.insertId
      });
    }
    
    connection.release();
    
    res.status(201).json({
      success: true,
      message: 'Đã trả lời bình luận thành công',
      data: replies[0]
    });
    
  } catch (error) {
    console.error('Error replying to comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi trả lời bình luận',
      error: error.message
    });
  }
};

// @desc    Follow a user
// @route   POST /api/users/:userId/follow
// @access  Private
exports.followUser = async (req, res) => {
  try {
    // Kiểm tra user đã đăng nhập
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để theo dõi người dùng'
      });
    }
    
    const { userId } = req.params;
    
    const connection = await pool.getConnection();
    
    // Kiểm tra xem đã theo dõi chưa
    const [existingFollow] = await connection.query(
      'SELECT * FROM follows WHERE follower_id = ? AND target_id = ?',
      [req.user.id, userId]
    );
    
    if (existingFollow.length > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Bạn đã theo dõi người dùng này rồi'
      });
    }
    
    // Thêm follow mới
    const [result] = await connection.query(
      'INSERT INTO follows (follower_id, target_id) VALUES (?, ?)',
      [req.user.id, userId]
    );
    
    // Lấy thông tin người dùng được theo dõi
    const [followedUser] = await connection.query(
      'SELECT id, name, picture FROM users WHERE id = ?',
      [userId]
    );
    
    // Gửi notification cho người dùng được theo dõi
    await notificationController.createNotification({
      user_id: userId,
      type: 'follow',
      title: 'Bạn có người theo dõi mới',
      content: `${req.user.name} đã theo dõi bạn.`,
      reference_id: req.user.id,
      reference_type: 'user'
    });
    
    connection.release();
    
    res.status(201).json({
      success: true,
      message: 'Đã theo dõi người dùng thành công',
      data: followedUser[0]
    });
    
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi theo dõi người dùng',
      error: error.message
    });
  }
};