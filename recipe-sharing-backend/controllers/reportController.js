const { pool } = require('../config/db');

// Create a report - generic handler that works for all report types
exports.createReport = async (req, res) => {
  let connection;
  try {
    const { type, target_id, reason, description } = req.body;
    const reporter_id = req.user.id;
    
    if (!type || !target_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required information: report type, target ID, and reason'
      });
    }
    
    connection = await pool.getConnection();
    
    // Check if the target exists based on report type
    let targetExists = false;
    let recipeId = null;
    
    if (type === 'recipe') {
      const [recipes] = await connection.query(
        'SELECT id FROM recipes WHERE id = ? AND is_deleted = 0',
        [target_id]
      );
      targetExists = recipes.length > 0;
      recipeId = target_id;
    } else if (type === 'comment') {
      const [comments] = await connection.query(
        'SELECT id, recipe_id FROM comments WHERE id = ?',
        [target_id]
      );
      targetExists = comments.length > 0;
      recipeId = comments.length > 0 ? comments[0].recipe_id : null;
    } else if (type === 'user') {
      const [users] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND is_blocked = 0',
        [target_id]
      );
      targetExists = users.length > 0;
    } else {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Invalid report type. Must be "recipe", "comment", or "user"'
      });
    }
    
    if (!targetExists) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'The reported item does not exist'
      });
    }
    
    // Insert the new report
    const [result] = await connection.query(
      `INSERT INTO reports (type, reported_id, reporter_id, recipe_id, reason, description, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [type, target_id, reporter_id, recipeId, reason, description || null]
    );
    
    connection.release();
    
    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        id: result.insertId,
        type,
        target_id,
        reporter_id,
        recipe_id: recipeId,
        reason,
        description,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating report:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Error creating report',
      error: error.message
    });
  }
};

// Specific handlers that use the generic createReport function
exports.reportRecipe = async (req, res) => {
  req.body.type = 'recipe';
  req.body.target_id = parseInt(req.params.id);
  return this.createReport(req, res);
};

exports.reportComment = async (req, res) => {
  req.body.type = 'comment';
  req.body.target_id = parseInt(req.params.id);
  return this.createReport(req, res);
};

exports.reportUser = async (req, res) => {
  req.body.type = 'user';
  req.body.target_id = parseInt(req.params.id);
  return this.createReport(req, res);
};

// Get a report by ID
exports.getReport = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    connection = await pool.getConnection();
    
    // Get the report - users can only view their own reports
    const [reports] = await connection.query(
      `SELECT r.*, u1.name as reporter_name, u2.name as reported_name
       FROM reports r
       INNER JOIN users u1 ON r.reporter_id = u1.id
       LEFT JOIN users u2 ON (r.type = 'user' AND r.reported_id = u2.id)
       WHERE r.id = ? AND r.reporter_id = ?`,
      [id, userId]
    );
    
    if (reports.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    connection.release();
    
    res.status(200).json({
      success: true,
      data: reports[0]
    });
  } catch (error) {
    console.error('Error getting report:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving report information',
      error: error.message
    });
  }
};

// Get all reports for the current user
exports.getUserReports = async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    
    connection = await pool.getConnection();
    
    const [reports] = await connection.query(
      `SELECT r.*, 
          CASE 
              WHEN r.type = 'recipe' THEN (SELECT title FROM recipes WHERE id = r.reported_id)
              WHEN r.type = 'comment' THEN (SELECT text FROM comments WHERE id = r.reported_id)
              WHEN r.type = 'user' THEN (SELECT name FROM users WHERE id = r.reported_id)
          END as target_name
       FROM reports r
       WHERE r.reporter_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error getting user reports:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false, 
      message: 'Error getting report list',
      error: error.message
    });
  }
};