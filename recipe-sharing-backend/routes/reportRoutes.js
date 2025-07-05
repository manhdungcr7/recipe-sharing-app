const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
// Thêm import checkAccountStatus
const { checkAccountStatus } = require('../middleware/checkAccountStatus');
const reportController = require('../controllers/reportController');

// Thêm checkAccountStatus vào các route báo cáo
router.post('/user/:id', protect, checkAccountStatus, reportController.reportUser);
router.post('/comment/:id', protect, checkAccountStatus, reportController.reportComment);
router.post('/recipe/:id', protect, checkAccountStatus, reportController.reportRecipe);

module.exports = router;