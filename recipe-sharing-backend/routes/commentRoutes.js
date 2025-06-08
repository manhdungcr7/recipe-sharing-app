const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// @route   GET /api/comments/recipe/:recipeId
// @desc    Get comments for a recipe
// @access  Public
router.get('/recipe/:recipeId', commentController.getRecipeComments);

// @route   POST /api/comments/recipe/:recipeId
// @desc    Create a new comment
// @access  Private
router.post('/recipe/:recipeId', protect, commentController.createComment);

// @route   POST /api/comments/:commentId/reply
// @desc    Reply to a comment
// @access  Private
router.post('/:commentId/reply', protect, commentController.replyToComment);

module.exports = router;