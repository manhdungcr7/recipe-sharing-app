const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, userController.getUserProfile);

// Update user profile
router.put('/profile', authenticate, userController.updateUserProfile);

// Get user followers
router.get('/:userId/followers', userController.getUserFollowers);

// Get user following
router.get('/:userId/following', userController.getUserFollowing);

// Follow a user
router.post('/:userId/follow', authenticate, userController.followUser);

// Unfollow a user
router.delete('/:userId/unfollow', authenticate, userController.unfollowUser);

module.exports = router;