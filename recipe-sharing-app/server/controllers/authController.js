const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const connection = require('../config/db'); // Import the database connection

// Register a new user
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Login a user
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        // Đảm bảo trả về đúng trường picture từ database
        const [user] = await connection.query(
            'SELECT id, name, email, role, picture FROM users WHERE id = ?',
            [req.user.id]
        );
        // Trả về user[0].picture (không tự động lấy lại ảnh Google)
        res.json(user[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// When returning user:
exports.getUserByEmail = async (req, res) => {
    const { email } = req.params;

    try {
        const [existingUsers] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        const user = existingUsers[0];

        // Đảm bảo lấy đúng trường picture từ database
        const userData = {
            id: user.id,
            name: user.name || name,
            email: user.email || email,
            // ƯU TIÊN ảnh đã upload nếu có, nếu không thì mới lấy ảnh Google
            picture: user.picture || picture,
            role: user.role || 'user',
            is_verified: 1
        };

        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Google ID and picture for the user
exports.updateGoogleIdAndPicture = async (req, res) => {
    const { sub, picture } = req.body;

    try {
        // Update the user's Google ID and picture only if the picture is not already set
        await connection.query(
            'UPDATE users SET google_id = ?, picture = ? WHERE id = ? AND (picture IS NULL OR picture = "")',
            [sub, picture, user.id]
        );

        res.json({ message: 'User profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};