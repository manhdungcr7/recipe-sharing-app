const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugMessages() {
  let connection;
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    connection = await pool.getConnection();
    console.log('Connected to database');
    
    // Truy vấn các tin nhắn admin_message trực tiếp
    const query = `
      SELECT n.*, u.name as sender_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.type = 'admin_message'
      ORDER BY n.created_at DESC
    `;
    
    const [messages] = await connection.query(query);
    
    console.log(`Found ${messages.length} admin messages:`);
    console.log(JSON.stringify(messages, null, 2));
    
    connection.release();
  } catch (error) {
    console.error('Error:', error);
    if (connection) connection.release();
  } finally {
    process.exit(0);
  }
}

debugMessages();