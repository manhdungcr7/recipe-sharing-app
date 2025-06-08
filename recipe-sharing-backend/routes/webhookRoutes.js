const express = require('express');
const router = express.Router();
const { syncRecipesToTypesense, syncUsersToTypesense } = require('../utils/typesenseSync');
const { protect, admin } = require('../middleware/auth'); // Đã sửa dòng này

// @route   POST /api/webhooks/typesense-sync
// @desc    Đồng bộ dữ liệu từ MySQL vào Typesense
// @access  Private/Admin
router.post('/typesense-sync', protect, admin, async (req, res) => {
  try {
    console.log('Starting Typesense sync');
    await syncRecipesToTypesense();
    await syncUsersToTypesense();
    console.log('Typesense sync completed');
    
    res.status(200).json({
      success: true,
      message: 'Đồng bộ dữ liệu thành công'
    });
  } catch (error) {
    console.error('Webhooks sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đồng bộ dữ liệu',
      error: error.message
    });
  }
});

module.exports = router;