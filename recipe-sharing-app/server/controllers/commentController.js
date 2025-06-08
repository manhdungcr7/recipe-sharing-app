const Comment = require('../models/Comment');
const Recipe = require('../models/Recipe');

// Add a new comment to a recipe
exports.addComment = async (req, res) => {
    try {
        const { recipeId, content } = req.body;
        const newComment = new Comment({
            recipe: recipeId,
            user: req.user.id,
            content,
        });

        await newComment.save();
        await Recipe.findByIdAndUpdate(recipeId, { $push: { comments: newComment._id } });

        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error });
    }
};

// Get comments for a specific recipe
exports.getComments = async (req, res) => {
    try {
        const { recipeId } = req.params;
        const comments = await Comment.find({ recipe: recipeId }).populate('user', 'username');

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error });
    }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        await comment.remove();
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comment', error });
    }
};