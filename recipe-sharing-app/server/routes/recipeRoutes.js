const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { authenticate } = require('../middleware/auth');

// Route to create a new recipe
router.post('/', authenticate, recipeController.createRecipe);

// Route to get all recipes
router.get('/', recipeController.getAllRecipes);

// Route to get a specific recipe by ID
router.get('/:id', recipeController.getRecipeById);

// Route to update a recipe by ID
router.put('/:id', authenticate, recipeController.updateRecipe);

// Route to delete a recipe by ID
router.delete('/:id', authenticate, recipeController.deleteRecipe);

// Route to get recipes by user ID
router.get('/user/:userId', recipeController.getRecipesByUserId);

module.exports = router;