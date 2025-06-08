const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

module.exports = {
    PORT: process.env.PORT || 5000,
    DB_URI: process.env.DB_URI || 'mongodb://localhost:27017/recipe-sharing',
    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret',
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1h',
    CLOUDINARY_URL: process.env.CLOUDINARY_URL || 'your_cloudinary_url',
    // Add other configuration settings as needed
};