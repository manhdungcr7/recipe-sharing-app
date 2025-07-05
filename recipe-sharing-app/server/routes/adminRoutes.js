const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// Route to get reports for moderation
router.get('/reports', authenticate, adminController.getReports);

// Route to manage users
router.get('/users', authenticate, adminController.getUsers);
router.put('/users/:id', authenticate, adminController.updateUser);
router.delete('/users/:id', authenticate, adminController.deleteUser);

// Route to moderate content
router.get('/content', authenticate, adminController.getContent);
router.put('/content/:id', authenticate, adminController.moderateContent);

// Route đăng nhập admin
router.post('/login', authController.adminLogin);

module.exports = router;