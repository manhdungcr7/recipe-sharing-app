const { pool } = require('../config/db');

/**
 * Kiểm tra và tạo bảng saved_recipes nếu chưa tồn tại
 */
const setupSavedRecipesTable = async () => {
  const connection = await pool.getConnection();
  
  try {
    const [tableCheck] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'saved_recipes'
    `);
    
    if (tableCheck[0].count === 0) {
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
    }
  } catch (error) {
    console.error('Error checking or creating saved_recipes table:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Kiểm tra và tạo bảng liked_recipes nếu chưa tồn tại
 */
const setupLikedRecipesTable = async () => {
  const connection = await pool.getConnection();
  
  try {
    const [tableCheck] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'liked_recipes'
    `);
    
    if (tableCheck[0].count === 0) {
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
    }
  } catch (error) {
    console.error('Error checking or creating liked_recipes table:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Thiết lập các bảng quan trọng trong database
 */
const setupDatabase = async () => {
  try {
    await setupSavedRecipesTable();
    await setupLikedRecipesTable();
    console.log('All required tables checked/created successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
};

module.exports = {
  setupDatabase,
  setupSavedRecipesTable,
  setupLikedRecipesTable
};