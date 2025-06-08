const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

// Route for generic report creation
router.post('/', protect, reportController.createReport);

// Routes for specific types of reports
router.post('/recipe/:id', protect, reportController.reportRecipe);
router.post('/comment/:id', protect, reportController.reportComment);
router.post('/user/:id', protect, reportController.reportUser);

// Route to get a specific report
router.get('/:id', protect, reportController.getReport);

// Route to get all reports for the current user
router.get('/user/my-reports', protect, reportController.getUserReports);

module.exports = router;