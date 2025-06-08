const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const recipeController = require('../controllers/recipe');
const { recipeMultiUpload } = require('../middleware/upload');
const { restoreRecipe } = require('../controllers/recipe/restoreRecipe');
const { permanentDeleteRecipe } = require('../controllers/recipe/permanentDeleteRecipe');

console.log('recipeRoutes loaded');

// QUAN TRỌNG: Routes cụ thể (/drafts, /saved) phải đặt TRƯỚC routes với params /:id
// Nếu không routes cụ thể sẽ không bao giờ được khớp

// Lấy danh sách bản nháp của người dùng hiện tại
router.get('/drafts', protect, recipeController.getDraftRecipes);

// Lưu bản nháp công thức mới
router.post('/draft', protect, (req, res, next) => {
  recipeMultiUpload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, recipeController.saveDraft);

// Lấy chi tiết bản nháp theo ID
router.get('/draft/:id', protect, recipeController.getDraftById);

// Cập nhật bản nháp
router.put('/draft/:id', protect, (req, res, next) => {
  recipeMultiUpload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, recipeController.updateDraft);

// Xóa bản nháp
router.delete('/draft/:id', protect, recipeController.deleteDraft);

// Chuyển bản nháp thành công thức chính thức
router.post('/draft/:id/publish', protect, recipeController.publishDraft);

// Lấy công thức đã lưu của người dùng hiện tại
router.get('/saved', protect, recipeController.getSavedRecipes);

// Lấy danh sách công thức đã xóa của người dùng hiện tại
router.get('/trash', protect, recipeController.getTrashedRecipes);

// Còn lại các routes thông thường

// Tạo công thức mới - sử dụng multiupload
router.post('/', protect, (req, res, next) => {
  console.log("POST /api/recipes - User:", req.user?.id || "Not authenticated");
  recipeMultiUpload(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, recipeController.createRecipe);

// GET lấy tất cả công thức (với phân trang)
router.get('/', recipeController.getRecipes);

// Lấy tất cả công thức của một người dùng
// router.get('/user/:userId', async (req, res) => {
//   try {
//     const userId = req.params.userId;
    
//     if (!userId || userId === 'undefined') {
//       return res.status(400).json({
//         success: false,
//         message: 'Cần cung cấp ID người dùng hợp lệ'
//       });
//     }
    
//     const connection = await require('../config/db').pool.getConnection();
    
//     // Lấy công thức của người dùng đã đăng
//     const [recipes] = await connection.query(
//       `SELECT r.*, 
//               u.name as author_name, u.picture as author_picture,
//               (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes_count,
//               (SELECT COUNT(*) FROM saves WHERE recipe_id = r.id) as saves_count,
//               (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id AND is_deleted = 0) as comments_count
//        FROM recipes r
//        LEFT JOIN users u ON r.author_id = u.id
//        WHERE r.author_id = ? AND r.status = 'published' AND r.is_deleted = 0
//        GROUP BY r.id
//        ORDER BY r.created_at DESC`, 
//       [userId]
//     );
    
//     connection.release();
    
//     res.json({
//       success: true,
//       data: recipes
//     });
//   } catch (error) {
//     console.error('Error getting user recipes:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Lỗi khi lấy danh sách công thức của người dùng', 
//       error: error.message 
//     });
    
//     if (connection) connection.release();
//   }
// });

// GET lấy công thức theo ID
router.get('/:id', recipeController.getRecipeById);

// Cập nhật công thức
router.put('/:id', protect, (req, res, next) => {
  recipeMultiUpload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, recipeController.updateRecipe);

// Xóa công thức
router.delete('/:id', protect, recipeController.deleteRecipe);

// Thích công thức
router.post('/:id/like', protect, recipeController.likeRecipe);

// Lưu công thức
router.post('/:id/save', protect, recipeController.saveRecipe);

// Bỏ lưu công thức
router.delete('/:id/save', protect, recipeController.unsaveRecipe);

// Xuất công thức ra PDF
router.get('/:id/pdf', recipeController.exportRecipePDF);

// Khôi phục công thức từ thùng rác
router.put('/:id/restore', protect, restoreRecipe);

// Xóa vĩnh viễn công thức
router.delete('/:id/permanent', protect, permanentDeleteRecipe);

module.exports = router;