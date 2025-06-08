const express = require('express');
const { addComment, getComments, deleteComment } = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Route to add a comment
router.post('/:recipeId/comments', authenticate, addComment);

// Route to get comments for a recipe
router.get('/:recipeId/comments', getComments);

// Route to delete a comment
router.delete('/comments/:commentId', authenticate, deleteComment);

module.exports = router;