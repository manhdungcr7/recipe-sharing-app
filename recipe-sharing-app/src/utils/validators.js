export const validateRecipeForm = (formData) => {
    const errors = {};
    
    if (!formData.title) {
        errors.title = "Title is required.";
    }
    
    if (!formData.ingredients || formData.ingredients.length === 0) {
        errors.ingredients = "At least one ingredient is required.";
    }
    
    if (!formData.steps || formData.steps.length === 0) {
        errors.steps = "At least one step is required.";
    }
    
    if (formData.cookingTime <= 0) {
        errors.cookingTime = "Cooking time must be a positive number.";
    }
    
    return errors;
};

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password) => {
    return password.length >= 6;
};