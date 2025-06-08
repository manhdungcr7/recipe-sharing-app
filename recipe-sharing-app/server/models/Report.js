const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    recipeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Recipe'
    },
    reason: {
        type: String,
        required: true,
        enum: ['Inappropriate Content', 'Spam', 'Copyright Violation', 'Other']
    },
    description: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', reportSchema);