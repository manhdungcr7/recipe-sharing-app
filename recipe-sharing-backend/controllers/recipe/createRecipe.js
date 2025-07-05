const { pool } = require('../../config/db');
const utils = require('./utils');
const notificationController = require('../notificationController'); // Import notification controller

/**
 * Tạo công thức mới
 * @route   POST /api/recipes
 * @access  Private
 */
exports.createRecipe = async (req, res) => {
  let connection;
  try {
    console.log("Create recipe API called by user:", req.user.id);
    const { title, description, cookingTime, servings, difficulty, category } = req.body;
    
    // Validate dữ liệu
    if (!title || !cookingTime) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    console.log("Saving recipe to database...");
    
    // Insert vào bảng recipes
    const [result] = await connection.query(
      `INSERT INTO recipes (title, description, cooking_time, servings, difficulty, 
                           category, author_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', NOW(), NOW())`,
      [title, description, cookingTime, servings, difficulty, category, req.user.id]
    );
    
    const recipeId = result.insertId;
    console.log("Recipe created with ID:", recipeId);
    
    // Xử lý hình ảnh chính
    if (req.files && req.files.image) {
      // Logic lưu ảnh
      // ...
    }
    
    // Xử lý nguyên liệu và các bước
    // ...
    
    await connection.commit();
    connection.release();
    
    res.status(201).json({
      success: true,
      message: 'Công thức đã được tạo thành công',
      data: {
        id: recipeId,
        title
      }
    });
    
  } catch (error) {
    console.error("ERROR creating recipe:", error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo công thức',
      error: error.message
    });
  }
};