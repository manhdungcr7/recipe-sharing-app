const express = require('express');
const router = express.Router();
const { protect, checkAccountStatus } = require('../middleware/auth');
const { recipeUpload, recipeMultiUpload } = require('../middleware/upload');
const recipeController = require('../controllers/recipeController');
const interactionController = require('../controllers/recipe/interactionRecipe');

// ĐẢM BẢO CÁC ROUTES CỤ THỂ ĐƯỢC ĐẶT TRƯỚC
// ===== Đặt các route đặc biệt lên trước =====
router.get('/drafts', protect, recipeController.getDrafts);
router.get('/draft/:id', protect, recipeController.getDraftById);
router.get('/saved', protect, recipeController.getSavedRecipes);
router.get('/trash', protect, recipeController.getTrashedRecipes);

// Lưu bản nháp công thức mới
router.post('/draft', protect, checkAccountStatus, (req, res, next) => {
  recipeMultiUpload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, recipeController.saveDraft);

// Cập nhật bản nháp
router.put('/draft/:id', protect, checkAccountStatus, (req, res, next) => {
  recipeMultiUpload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, recipeController.updateDraft);

// Xóa bản nháp
router.delete('/draft/:id', protect, recipeController.deleteDraft);

// Chuyển bản nháp thành công thức chính thức
router.post('/draft/:id/publish', protect, checkAccountStatus, recipeController.publishDraft);

// Tạo công thức mới - sử dụng multiupload
router.post('/', protect, checkAccountStatus, (req, res, next) => {
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

// Cập nhật công thức
router.put('/:id', protect, checkAccountStatus, (req, res, next) => {
  recipeMultiUpload(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, recipeController.updateRecipe);

// Xóa công thức
router.delete('/:id', protect, recipeController.deleteRecipe);

// Route cho thích công thức
router.post('/:id/like', protect, async (req, res) => {
    try {
        // Gọi hàm controller
        await interactionController.likeRecipe(req, res);
    } catch (error) {
        console.error("Error in like route:", error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thích công thức',
            error: error.message
        });
    }
});

// Route cho lưu công thức
router.post('/:id/save', protect, async (req, res) => {
    try {
        // Gọi hàm controller
        await interactionController.saveRecipe(req, res);
    } catch (error) {
        console.error("Error in save route:", error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lưu công thức',
            error: error.message
        });
    }
});

router.delete('/:id/save', protect, async (req, res) => {
    try {
        await interactionController.unsaveRecipe(req, res);
    } catch (error) {
        console.error("Error in unsave route:", error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi bỏ lưu công thức',
            error: error.message
        });
    }
});

// Route cho chia sẻ công thức
router.post('/:id/share', protect, async (req, res) => {
    try {
        // Gọi hàm controller
        await interactionController.shareRecipe(req, res);
    } catch (error) {
        console.error("Error in share route:", error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi chia sẻ công thức',
            error: error.message
        });
    }
});

// Route cho xuất PDF
router.get('/:id/pdf', async (req, res) => {
    try {
        // Gọi hàm controller
        await interactionController.exportRecipeToPDF(req, res);
    } catch (error) {
        console.error("Error in PDF export route:", error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xuất PDF',
            error: error.message
        });
    }
});

// Khôi phục công thức từ thùng rác
router.put('/:id/restore', protect, restoreRecipe);

// Xóa vĩnh viễn công thức
router.delete('/:id/permanent', protect, permanentDeleteRecipe);

// Thêm comment cho công thức
// router.post('/:id/comments', protect, checkAccountStatus, commentController.addComment);

// ===== ROUTE ĐỘNG CUỐI CÙNG =====
// Đặt xuống cuối cùng để tránh bắt các routes khác
router.get('/:id', recipeController.getRecipeById);

module.exports = router;