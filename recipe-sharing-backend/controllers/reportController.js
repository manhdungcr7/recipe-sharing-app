const { pool } = require('../config/db');

exports.reportRecipe = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { reason, details } = req.body;
    const reporterId = req.user.id;

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'ID công thức không hợp lệ'
      });
    }

    connection = await pool.getConnection();

    // Kiểm tra công thức tồn tại
    const [recipes] = await connection.query(
      'SELECT r.id, r.author_id, r.title, u.name as author_name FROM recipes r JOIN users u ON r.author_id = u.id WHERE r.id = ?',
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

    // Kiểm tra người dùng không báo cáo công thức của chính mình
    if (recipe.author_id == reporterId) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể báo cáo công thức của chính mình'
      });
    }

    // Tạo báo cáo mới
    const [result] = await connection.query(
      `INSERT INTO reports (reported_id, reporter_id, type, reason, description, status, resource_title, recipe_id, created_at)
       VALUES (?, ?, 'recipe', ?, ?, 'pending', ?, ?, NOW())`,
      [id, reporterId, reason, details, recipe.title, id]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Báo cáo đã được gửi thành công',
      reportId: result.insertId
    });
  } catch (error) {
    console.error('Error reporting recipe:', error);
    if (connection) connection.release();

    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi báo cáo',
      error: error.message
    });
  }
};

exports.reportComment = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { reason, details } = req.body;
    const reporterId = req.user.id;

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'ID bình luận không hợp lệ'
      });
    }

    connection = await pool.getConnection();

    // Kiểm tra comment tồn tại
    const [comments] = await connection.query(
      'SELECT c.id, c.user_id, c.text, c.recipe_id, u.name as user_name, r.title as recipe_title FROM comments c JOIN users u ON c.user_id = u.id JOIN recipes r ON c.recipe_id = r.id WHERE c.id = ?',
      [id]
    );

    if (comments.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    const comment = comments[0];

    // Kiểm tra không báo cáo comment của chính mình
    if (comment.user_id == reporterId) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể báo cáo bình luận của chính mình'
      });
    }

    // Tạo báo cáo mới
    const [result] = await connection.query(
      `INSERT INTO reports (reported_id, reporter_id, type, reason, description, status, resource_title, recipe_id, created_at)
       VALUES (?, ?, 'comment', ?, ?, 'pending', ?, ?, NOW())`,
      [id, reporterId, reason, details, `Bình luận trong "${comment.recipe_title}"`, comment.recipe_id]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Báo cáo đã được gửi thành công',
      reportId: result.insertId
    });
  } catch (error) {
    console.error('Error reporting comment:', error);
    if (connection) connection.release();

    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi báo cáo',
      error: error.message
    });
  }
};

exports.reportUser = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { reason, details } = req.body;
    const reporterId = req.user.id;

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    if (reporterId == id) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể báo cáo chính mình'
      });
    }

    connection = await pool.getConnection();

    // Kiểm tra người dùng tồn tại
    const [users] = await connection.query(
      'SELECT id, name FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const user = users[0];

    // Tạo báo cáo mới
    const [result] = await connection.query(
      `INSERT INTO reports (reported_id, reporter_id, type, reason, description, status, resource_title, created_at)
       VALUES (?, ?, 'user', ?, ?, 'pending', ?, NOW())`,
      [id, reporterId, reason, details, user.name]
    );

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Báo cáo đã được gửi thành công',
      reportId: result.insertId
    });
  } catch (error) {
    console.error('Error reporting user:', error);
    if (connection) connection.release();

    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi báo cáo',
      error: error.message
    });
  }
};