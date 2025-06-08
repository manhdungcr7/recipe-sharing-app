const { pool } = require('../../config/db');

/**
 * Cập nhật công thức
 * @route   PUT /api/recipes/:id
 * @access  Private
 */
exports.updateRecipe = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Kiểm tra quyền sở hữu công thức
    const [recipes] = await connection.query(
      `SELECT id FROM recipes 
       WHERE id = ? AND author_id = ? AND status = 'published' AND is_deleted = 0`,
      [req.params.id, req.user.id]
    );
    
    if (recipes.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức hoặc không có quyền chỉnh sửa'
      });
    }
    
    const recipeId = recipes[0].id;
    
    // Thực hiện cập nhật giống như updateDraft
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
      const ingredients = typeof req.body.ingredients === 'string' 
        ? JSON.parse(req.body.ingredients) 
        : req.body.ingredients;
      
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
      const steps = typeof req.body.steps === 'string'
        ? JSON.parse(req.body.steps)
        : req.body.steps;
      
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
      message: 'Công thức đã được cập nhật',
      data: { id: recipeId }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật công thức',
      error: error.message
    });
  } finally {
    connection.release();
  }
};