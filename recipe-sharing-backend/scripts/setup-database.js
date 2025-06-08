const { pool } = require('../config/db');
const path = require('path');
const fs = require('fs');

async function setupDatabase() {
  console.log('Checking and setting up database tables...');
  
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Kiểm tra và tạo bảng saved_recipes nếu chưa tồn tại
    const [savedRecipesTableCheck] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'saved_recipes'
    `);
    
    if (savedRecipesTableCheck[0].count === 0) {
      console.log('Creating saved_recipes table...');
      await connection.query(`
        CREATE TABLE saved_recipes (
          id INT(11) NOT NULL AUTO_INCREMENT,
          user_id INT(11) NOT NULL,
          recipe_id INT(11) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY unique_user_recipe (user_id, recipe_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        )
      `);
      console.log('saved_recipes table created successfully');
    } else {
      console.log('saved_recipes table already exists');
    }

    // Kiểm tra và tạo bảng liked_recipes nếu chưa tồn tại
    const [likedRecipesTableCheck] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'liked_recipes'
    `);
    
    if (likedRecipesTableCheck[0].count === 0) {
      console.log('Creating liked_recipes table...');
      await connection.query(`
        CREATE TABLE liked_recipes (
          id INT(11) NOT NULL AUTO_INCREMENT,
          user_id INT(11) NOT NULL,
          recipe_id INT(11) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY unique_user_recipe (user_id, recipe_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        )
      `);
      console.log('liked_recipes table created successfully');
    } else {
      console.log('liked_recipes table already exists');
    }

    console.log('Database setup completed');
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    if (connection) connection.release();
  }
}

// Chạy setup khi script được thực thi trực tiếp
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
}

module.exports = { setupDatabase };