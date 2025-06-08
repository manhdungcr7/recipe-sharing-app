const mysql = require('mysql2/promise');
const config = require('./config');

console.log("Database config:", {
  host: config.db.host,
  user: config.db.user,
  database: config.db.database,
  password: config.db.password ? '(password set)' : '(no password)'
});

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối khi khởi động
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Database connection successful');
    conn.release();
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();

module.exports = { pool };