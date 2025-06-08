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
    // Kiểm tra thông tin người dùng
    console.log("Creating recipe for user:", req.user?.id || "Unknown");
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để tạo công thức'
      });
    }
    
    const { title, ingredients, steps, cookingTime, thoughts, status } = req.body;
    
    // Xử lý ảnh chính của công thức
    const imageUrl = utils.processMainImage(req);
    
    // Bắt đầu transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    console.log("Starting database transaction...");
    console.log("Inserting recipe with params:", {
      title, 
      authorId: req.user.id, 
      imageUrl, 
      cookingTime, 
      thoughts
    });
    
    // Insert vào bảng recipes với imageUrl đã xử lý
    const [recipeResult] = await connection.query(
      `INSERT INTO recipes 
       (title, author_id, image_url, cooking_time, thoughts, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, req.user.id, imageUrl, cookingTime, thoughts || null, status]
    );
    
    const recipeId = recipeResult.insertId;
    console.log("Recipe inserted with ID:", recipeId);
    
    // Thêm nguyên liệu
    const parsedIngredients = utils.parseJsonData(ingredients);
    
    if (Array.isArray(parsedIngredients)) {
      for (const ingredient of parsedIngredients) {
        if (ingredient && ingredient.name) {
          await connection.query(
            'INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)',
            [recipeId, ingredient.name, ingredient.quantity || '', ingredient.unit || null]
          );
        }
      }
    }
    
    // Thêm các bước
    const parsedSteps = utils.parseJsonData(steps);
    
    if (Array.isArray(parsedSteps)) {
      for (let i = 0; i < parsedSteps.length; i++) {
        const step = parsedSteps[i];
        if (step && step.description) {
          const [stepResult] = await connection.query(
            `INSERT INTO steps (recipe_id, description, order_index) VALUES (?, ?, ?)`,
            [recipeId, step.description, i]
          );
          console.log(`Step ${i} inserted with ID:`, stepResult.insertId);
        }
      }
    }
    
    // Xử lý hình ảnh cho các bước
    console.log("Processing step media files...");
    await utils.processStepImages(req, recipeId, connection);
    
    // Commit transaction
    console.log("Committing transaction...");
    await connection.commit();
    
    // Gửi thông báo đến người theo dõi
    const [followers] = await connection.query(
      'SELECT follower_id FROM follows WHERE followed_id = ?',
      [req.user.id]
    );

    for (const follower of followers) {
      try {
        await notificationController.createNotification({
          recipient_id: follower.follower_id,
          sender_id: req.user.id,
          type: 'new_post',
          content: `${req.user.name} vừa đăng bài "${title}"`,
          related_recipe_id: recipeId
        });
      } catch (err) {
        console.error('Error sending notification to follower:', follower.follower_id, err);
      }
    }
    
    // Phản hồi thành công
    res.status(201).json({
      success: true,
      data: {
        id: recipeId,
        title,
        status,
        image_url: imageUrl,
        message: status === 'published' 
          ? 'Công thức đã được đăng thành công!' 
          : 'Công thức đã được gửi và đang chờ kiểm duyệt'
      }
    });
    
  } catch (error) {
    console.error("ERROR in createRecipe:", error);
    
    // Rollback nếu có lỗi
    if (connection) {
      try {
        console.log("Rolling back transaction");
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo công thức',
      error: error.message
    });
  } finally {
    // Giải phóng kết nối trong mọi trường hợp
    if (connection) {
      connection.release();
    }
  }
};