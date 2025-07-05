const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugNotifications() {
  let connection;
  try {
    // Kết nối tới database
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'recipe_sharing',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    connection = await pool.getConnection();
    
    // In thông tin kết nối
    console.log('Connected to database:', process.env.DB_NAME);
    
    // 1. Lấy tất cả tin nhắn admin_message
    console.log('\n--- Tất cả tin nhắn admin_message ---');
    const [allMessages] = await connection.query(
      `SELECT * FROM notifications WHERE type = 'admin_message'`
    );
    console.log(`Tìm thấy ${allMessages.length} tin nhắn`);
    console.log(allMessages);
    
    // 2. Thử query với JOIN để xem có vấn đề gì với JOIN không
    console.log('\n--- Query với JOIN ---');
    const [joinedMessages] = await connection.query(`
      SELECT n.*, u.name as sender_name, u.picture as sender_picture 
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.type = 'admin_message'
      ORDER BY n.created_at DESC
    `);
    console.log(`Tìm thấy ${joinedMessages.length} tin nhắn với JOIN`);
    console.log(joinedMessages);
    
    // 3. Kiểm tra người dùng có sender_id tương ứng có tồn tại không
    console.log('\n--- Kiểm tra sender_id ---');
    const senderIds = allMessages.map(m => m.sender_id).filter((value, index, self) => self.indexOf(value) === index);
    
    for (const senderId of senderIds) {
      const [users] = await connection.query(`SELECT * FROM users WHERE id = ?`, [senderId]);
      console.log(`Sender ID ${senderId}: ${users.length > 0 ? 'Tồn tại' : 'KHÔNG tồn tại'}`);
    }
    
    // 4. Kiểm tra người dùng có recipient_id tương ứng có tồn tại không
    console.log('\n--- Kiểm tra recipient_id ---');
    const recipientIds = allMessages.map(m => m.recipient_id).filter((value, index, self) => self.indexOf(value) === index);
    
    for (const recipientId of recipientIds) {
      const [users] = await connection.query(`SELECT * FROM users WHERE id = ?`, [recipientId]);
      console.log(`Recipient ID ${recipientId}: ${users.length > 0 ? 'Tồn tại' : 'KHÔNG tồn tại'}`);
    }
    
    connection.release();
  } catch (error) {
    console.error('Error debugging notifications:', error);
    if (connection) connection.release();
  } finally {
    process.exit(0);
  }
}

debugNotifications();