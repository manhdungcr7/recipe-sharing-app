const { pool } = require('../../config/db');
const utils = require('./utils');
const notificationController = require('../notificationController');

/**
 * Lưu bản nháp công thức
 * @route   POST /api/recipes/draft
 * @access  Private
 */
exports.saveDraft = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Lấy thông tin từ request body
    const { title, cookingTime, thoughts } = req.body;
    const steps = req.body.steps ? JSON.parse(req.body.steps) : [];
    const ingredientsData = req.body.ingredients ? JSON.parse(req.body.ingredients) : [];
    
    console.log("Creating draft recipe for user:", req.user.id);
    
    // Lấy hình ảnh chính nếu có
    const imageUrl = utils.processMainImage(req);
    
    // Lưu thông tin công thức vào database
    const [result] = await connection.query(
      `INSERT INTO recipes 
       (title, author_id, image_url, cooking_time, thoughts, status)
       VALUES (?, ?, ?, ?, ?, 'draft')`,
      [
        title || "Bản nháp chưa đặt tên",
        req.user.id,
        imageUrl,
        cookingTime || null,
        thoughts || null
      ]
    );
    
    const recipeId = result.insertId;
    console.log("Draft recipe inserted with ID:", recipeId);
    
    // Lưu nguyên liệu
    if (ingredientsData && ingredientsData.length > 0) {
      for (const [index, ing] of ingredientsData.entries()) {
        if (ing.name) {
          await connection.query(
            `INSERT INTO ingredients (recipe_id, name, quantity, unit, order_index)
             VALUES (?, ?, ?, ?, ?)`,
            [recipeId, ing.name, ing.quantity, ing.unit, index]
          );
        }
      }
    }
    
    // Lưu các bước
    if (steps && steps.length > 0) {
      for (const [index, step] of steps.entries()) {
        if (step.description) {
          const [stepResult] = await connection.query(
            `INSERT INTO steps (recipe_id, description, order_index)
             VALUES (?, ?, ?)`,
            [recipeId, step.description, index]
          );
          
          const stepId = stepResult.insertId;
          console.log(`Step ${index} inserted with ID:`, stepId);
          
          // Xử lý hình ảnh cho bước này nếu có
          const stepImageKey = `step_images[${index}]`;
          if (req.files) {
            let stepImage = null;
            
            if (Array.isArray(req.files)) {
              stepImage = req.files.find(f => f.fieldname === stepImageKey);
            } else if (req.files[stepImageKey]) {
              stepImage = req.files[stepImageKey][0];
            }
            
            if (stepImage) {
              const imageUrl = `/uploads/steps/${stepImage.filename}`;
              console.log(`Step ${index} image saved:`, imageUrl);
              
              await connection.query(
                'UPDATE steps SET image_url = ? WHERE id = ?',
                [imageUrl, stepId]
              );
            }
          }
        }
      }
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Bản nháp công thức đã được lưu',
      data: {
        id: recipeId,
        title: title || "Bản nháp chưa đặt tên"
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error saving draft recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu bản nháp công thức',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Lấy danh sách bản nháp của người dùng
 * @route   GET /api/recipes/drafts
 * @access  Private
 */
exports.getDrafts = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [drafts] = await connection.query(
      `SELECT id, title, image_url, created_at, updated_at
       FROM recipes
       WHERE author_id = ? AND status = 'draft' AND is_deleted = 0
       ORDER BY updated_at DESC`,
      [req.user.id]
    );
    
    connection.release();
    
    res.json({
      success: true,
      data: drafts
    });
    
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bản nháp',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết bản nháp theo ID
 * @route   GET /api/recipes/draft/:id
 * @access  Private
 */
exports.getDraftById = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Lấy thông tin bản nháp
    const [recipes] = await connection.query(
      `SELECT r.*, u.name as author_name, u.picture as author_picture
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       WHERE r.id = ? AND r.author_id = ? AND r.status = 'draft' AND r.is_deleted = 0`,
      [req.params.id, req.user.id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp hoặc không có quyền truy cập'
      });
    }
    
    const recipe = recipes[0];
    
    // Lấy nguyên liệu
    const [ingredients] = await connection.query(
      `SELECT id, name, quantity, unit, order_index
       FROM ingredients
       WHERE recipe_id = ?
       ORDER BY order_index ASC`,
      [recipe.id]
    );
    
    // Lấy các bước
    const [steps] = await connection.query(
      `SELECT id, description, image_url, order_index
       FROM steps
       WHERE recipe_id = ?
       ORDER BY order_index ASC`,
      [recipe.id]
    );
    
    connection.release();
    
    // Đính kèm nguyên liệu và các bước vào đối tượng công thức
    recipe.ingredients = ingredients;
    recipe.steps = steps;
    
    res.json({
      success: true,
      data: recipe
    });
    
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin bản nháp',
      error: error.message
    });
  }
};

/**
 * Cập nhật bản nháp
 * @route   PUT /api/recipes/draft/:id
 * @access  Private
 */
exports.updateDraft = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Kiểm tra quyền sở hữu bản nháp
    const [recipes] = await connection.query(
      `SELECT id FROM recipes 
       WHERE id = ? AND author_id = ? AND status = 'draft' AND is_deleted = 0`,
      [req.params.id, req.user.id]
    );
    
    if (recipes.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp hoặc không có quyền chỉnh sửa'
      });
    }
    
    const recipeId = recipes[0].id;
    
    // Cập nhật thông tin cơ bản
    const { title, cookingTime, thoughts } = req.body;
    const updateFields = [];
    const updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    
    if (cookingTime !== undefined) {
      updateFields.push('cooking_time = ?');
      updateValues.push(cookingTime);
    }
    
    if (thoughts !== undefined) {
      updateFields.push('thoughts = ?');
      updateValues.push(thoughts);
    }
    
    // Cập nhật hình ảnh nếu có
    if (req.files && (Array.isArray(req.files) ? req.files.some(f => f.fieldname === 'image') : req.files.image)) {
      const imageFile = Array.isArray(req.files) 
        ? req.files.find(f => f.fieldname === 'image')
        : req.files.image[0];
      
      if (imageFile) {
        const imageUrl = `/uploads/recipes/${imageFile.filename}`;
        updateFields.push('image_url = ?');
        updateValues.push(imageUrl);
      }
    }
    
    // Cập nhật thông tin trong database nếu có thay đổi
    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      
      await connection.query(
        `UPDATE recipes SET ${updateFields.join(', ')} WHERE id = ?`,
        [...updateValues, recipeId]
      );
    }
    
    // Cập nhật nguyên liệu nếu có
    if (req.body.ingredients) {
      const ingredients = JSON.parse(req.body.ingredients);
      
      // Xóa nguyên liệu cũ
      await connection.query('DELETE FROM ingredients WHERE recipe_id = ?', [recipeId]);
      
      // Thêm nguyên liệu mới
      if (ingredients && ingredients.length > 0) {
        for (const [index, ing] of ingredients.entries()) {
          if (ing.name) {
            await connection.query(
              `INSERT INTO ingredients (recipe_id, name, quantity, unit, order_index)
               VALUES (?, ?, ?, ?, ?)`,
              [recipeId, ing.name, ing.quantity, ing.unit, index]
            );
          }
        }
      }
    }
    
    // Cập nhật các bước nếu có
    if (req.body.steps) {
      const steps = JSON.parse(req.body.steps);
      
      // Xóa các bước cũ
      await connection.query('DELETE FROM steps WHERE recipe_id = ?', [recipeId]);
      
      // Thêm các bước mới
      if (steps && steps.length > 0) {
        for (const [index, step] of steps.entries()) {
          if (step.description) {
            const [stepResult] = await connection.query(
              `INSERT INTO steps (recipe_id, description, order_index)
               VALUES (?, ?, ?)`,
              [recipeId, step.description, index]
            );
            
            const stepId = stepResult.insertId;
            
            // Xử lý hình ảnh cho bước này nếu có
            const stepImageKey = `step_images[${index}]`;
            if (req.files) {
              let stepImage = null;
              
              if (Array.isArray(req.files)) {
                stepImage = req.files.find(f => f.fieldname === stepImageKey);
              } else if (req.files[stepImageKey]) {
                stepImage = req.files[stepImageKey][0];
              }
              
              if (stepImage) {
                const imageUrl = `/uploads/steps/${stepImage.filename}`;
                await connection.query(
                  'UPDATE steps SET image_url = ? WHERE id = ?',
                  [imageUrl, stepId]
                );
              }
            }
          }
        }
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Bản nháp đã được cập nhật',
      data: { id: recipeId }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating draft:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật bản nháp',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Xóa bản nháp
 * @route   DELETE /api/recipes/draft/:id
 * @access  Private
 */
exports.deleteDraft = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Kiểm tra quyền sở hữu bản nháp
    const [recipes] = await connection.query(
      `SELECT id FROM recipes 
       WHERE id = ? AND author_id = ? AND status = 'draft'`,
      [req.params.id, req.user.id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp hoặc không có quyền xóa'
      });
    }
    
    // Thực hiện xóa mềm (soft delete)
    await connection.query(
      `UPDATE recipes SET is_deleted = 1, updated_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    
    connection.release();
    
    res.json({
      success: true,
      message: 'Bản nháp đã được xóa'
    });
    
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bản nháp',
      error: error.message
    });
    
    if (connection) connection.release();
  }
};

/**
 * Đăng bản nháp thành công thức chính thức
 * @route   POST /api/recipes/draft/:id/publish
 * @access  Private
 */
exports.publishDraft = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Kiểm tra quyền sở hữu bản nháp
    const [recipes] = await connection.query(
      `SELECT id, title FROM recipes 
       WHERE id = ? AND author_id = ? AND status = 'draft' AND is_deleted = 0`,
      [req.params.id, req.user.id]
    );
    
    if (recipes.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản nháp hoặc không có quyền đăng'
      });
    }
    
    const recipeId = recipes[0].id;
    
    // Kiểm tra các trường bắt buộc
    const [recipeDetails] = await connection.query(
      `SELECT title, cooking_time, image_url FROM recipes WHERE id = ?`,
      [recipeId]
    );
    
    const recipe = recipeDetails[0];
    
    if (!recipe.title) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Bạn cần đặt tên cho công thức trước khi đăng'
      });
    }
    
    if (!recipe.cooking_time) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Bạn cần nhập thời gian nấu trước khi đăng'
      });
    }
    
    // Kiểm tra xem có nguyên liệu chưa
    const [ingredients] = await connection.query(
      `SELECT COUNT(*) as count FROM ingredients WHERE recipe_id = ?`,
      [recipeId]
    );
    
    if (ingredients[0].count === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Bạn cần thêm ít nhất một nguyên liệu trước khi đăng'
      });
    }
    
    // Kiểm tra xem có các bước chưa
    const [steps] = await connection.query(
      `SELECT COUNT(*) as count FROM steps WHERE recipe_id = ?`,
      [recipeId]
    );
    
    if (steps[0].count === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Bạn cần thêm ít nhất một bước thực hiện trước khi đăng'
      });
    }
    
    // Chuyển trạng thái thành published
    await connection.query(
      `UPDATE recipes SET status = 'published', updated_at = NOW() WHERE id = ?`,
      [recipeId]
    );
    
    // LẤY DANH SÁCH FOLLOWER VÀ GỬI THÔNG BÁO
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
          content: `${req.user.name} vừa đăng bài "${recipe.title}"`,
          related_recipe_id: recipeId
        });
      } catch (err) {
        console.error('Error sending notification to follower:', follower.follower_id, err);
      }
    }

    connection.release();
    
    res.json({
      success: true,
      message: 'Công thức đã được đăng thành công',
      data: {
        id: recipeId,
        title: recipe.title
      }
    });
    
  } catch (error) {
    console.error('Error publishing draft:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng công thức',
      error: error.message
    });
    
    if (connection) connection.release();
  }
};