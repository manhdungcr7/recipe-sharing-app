const createRecipeController = require('./createRecipe');
const getRecipesController = require('./getRecipes');
const recipeDetailController = require('./recipeDetail');
const updateRecipeController = require('./updateRecipe');
const deleteRecipeController = require('./deleteRecipe');
const draftRecipeController = require('./draftRecipe');
const interactionRecipeController = require('./interactionRecipe');

// Export tất cả controllers
module.exports = {
  // Tạo công thức mới
  createRecipe: createRecipeController.createRecipe,
  
  // Lấy danh sách công thức
  getRecipes: getRecipesController.getRecipes,
  getUserRecipes: getRecipesController.getUserRecipes,
  getSavedRecipes: getRecipesController.getSavedRecipes,
  getAllRecipesByUser: getRecipesController.getAllRecipesByUser,
  getTrashedRecipes: getRecipesController.getTrashedRecipes,
  
  // Lấy chi tiết công thức
  getRecipeById: recipeDetailController.getRecipeById,
  getRecipe: recipeDetailController.getRecipe,
  
  // Cập nhật công thức
  updateRecipe: updateRecipeController.updateRecipe,
  
  // Xóa công thức
  deleteRecipe: deleteRecipeController.deleteRecipe,
  
  // Tương tác công thức
  likeRecipe: interactionRecipeController.likeRecipe,
  saveRecipe: interactionRecipeController.saveRecipe,
  unsaveRecipe: interactionRecipeController.unsaveRecipe,
  
  // Bản nháp công thức
  saveDraft: draftRecipeController.saveDraft,
  getUserDrafts: draftRecipeController.getDrafts, // Đúng tên hàm!
  getDraftById: draftRecipeController.getDraftById,
  updateDraft: draftRecipeController.updateDraft,
  deleteDraft: draftRecipeController.deleteDraft,
  publishDraft: draftRecipeController.publishDraft,
  getDraftRecipes: draftRecipeController.getDrafts,
  exportRecipePDF: require('./exportRecipePDF').exportRecipePDF,
};