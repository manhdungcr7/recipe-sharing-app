// File này chỉ dùng để forward sang ./recipe
module.exports = require('./recipe');
const { pool } = require('../config/db');
const notificationController = require('./notificationController');
const interactionController = require('./recipe/interactionRecipe');

exports.getSavedRecipes = async (req, res) => {
  const userId = req.user.id; // Lấy từ middleware xác thực
  const connection = await pool.getConnection();
  try {
    const [recipes] = await connection.query(
      `SELECT r.* FROM recipes r
       JOIN saved_recipes s ON r.id = s.recipe_id
       WHERE s.user_id = ? AND r.is_deleted = 0
       ORDER BY s.created_at DESC`,
      [userId]
    );
    connection.release();
    res.json({ success: true, data: recipes });
  } catch (error) {
    connection.release();
    res.status(500).json({ success: false, message: 'Lỗi khi lấy công thức đã lưu', error: error.message });
  }
  
  // Sau khi lưu like vào DB:
  if (recipeAuthorId !== userId) {
    await notificationController.createNotification({
      user_id: recipeAuthorId,
      type: 'like',
      title: 'Công thức của bạn vừa được thích',
      content: `${userName} đã thích công thức "${recipeTitle}" của bạn.`,
      reference_id: recipeId,
      reference_type: 'recipe'
    });
  }

  // Sau khi lưu bài đăng thành công:
  const [followers] = await connection.query(
    'SELECT follower_id FROM follows WHERE followed_id = ?',
    [authorId]
  );

  for (const follower of followers) {
    await notificationController.createNotification({
      recipient_id: follower.follower_id,
      sender_id: authorId,
      type: 'new_post',
      content: `${authorName} vừa đăng bài "${recipeTitle}"`,
      related_recipe_id: recipeId
    });
  }
};

// Nếu sử dụng cấu trúc tách file riêng, kiểm tra import
const deleteRecipe = require('./recipe/deleteRecipe');

// Export deleteRecipe
module.exports = {
  // ...các controller khác
  deleteRecipe,
  likeRecipe: interactionController.likeRecipe,
  saveRecipe: interactionController.saveRecipe,
  unsaveRecipe: interactionController.unsaveRecipe,
  shareRecipe: interactionController.shareRecipe,
  exportRecipeToPDF: interactionController.exportRecipeToPDF
};

