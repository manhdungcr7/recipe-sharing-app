const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Tìm kiếm công thức
router.get('/recipes', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Thiếu từ khóa tìm kiếm' });
    }
    const [recipes] = await pool.query(
      `SELECT r.*, u.name as author_name, u.picture as author_picture
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       WHERE r.is_deleted = 0 AND r.status = 'published'
         AND (r.title LIKE ? OR r.thoughts LIKE ?)
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [`%${query}%`, `%${query}%`]
    );
    res.json({ success: true, data: recipes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tìm kiếm công thức', error: error.message });
  }
});

// Gợi ý từ khóa phổ biến (fake data)
router.get('/popular', (req, res) => {
  res.json({
    success: true,
    popularKeywords: ['Phở', 'Bún chả', 'Gà rán', 'Pizza', 'Sushi', 'Bánh mì', 'Cơm tấm', 'Bún bò', 'Bánh xèo', 'Chả giò']
  });
});

// Tìm kiếm người dùng theo tên hoặc email (không phân biệt hoa thường)
router.get('/users', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Thiếu từ khóa tìm kiếm' });
    }
    const [users] = await pool.query(
      `SELECT id, name, email, picture
       FROM users
       WHERE (LOWER(name) LIKE ? OR LOWER(email) LIKE ?)
       ORDER BY id DESC
       LIMIT 50`,
      [`%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`]
    );
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi tìm kiếm người dùng', error: error.message });
  }
});

// Gợi ý tự động cho thanh tìm kiếm (tên món ăn + tên user)
router.get('/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, results: [] });
    }
    // Gợi ý tên món ăn
    const [recipes] = await pool.query(
      `SELECT id, title FROM recipes WHERE is_deleted = 0 AND status = 'published' AND title LIKE ? LIMIT 5`,
      [`%${q}%`]
    );
    // Gợi ý tên user
    const [users] = await pool.query(
      `SELECT id, name FROM users WHERE LOWER(name) LIKE ? LIMIT 5`,
      [`%${q.toLowerCase()}%`]
    );
    // Định dạng kết quả
    const results = [
      ...recipes.map(r => ({ type: 'recipe', id: r.id, name: r.title })),
      ...users.map(u => ({ type: 'user', id: u.id, name: u.name }))
    ];
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi autocomplete', error: error.message });
  }
});

module.exports = router;