const { body, validationResult } = require('express-validator');

const validateRecipe = [
    body('title')
        .notEmpty()
        .withMessage('Title is required.')
        .isLength({ max: 100 })
        .withMessage('Title must not exceed 100 characters.'),
    
    body('ingredients')
        .isArray({ min: 1 })
        .withMessage('At least one ingredient is required.'),
    
    body('steps')
        .isArray({ min: 1 })
        .withMessage('At least one step is required.'),
    
    body('cookingTime')
        .isInt({ min: 1 })
        .withMessage('Cooking time must be a positive integer.'),
    
    body('image')
        .optional()
        .isURL()
        .withMessage('Image must be a valid URL.'),
];

const validateUserRegistration = [
    body('username')
        .notEmpty()
        .withMessage('Username is required.')
        .isLength({ max: 30 })
        .withMessage('Username must not exceed 30 characters.'),
    
    body('email')
        .isEmail()
        .withMessage('Email is not valid.'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required.')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long.'),
];

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validateRecipe,
    validateUserRegistration,
    validateRequest,
};