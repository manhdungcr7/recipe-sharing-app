const { pool } = require('../config/db');

(async () => {
  const connection = await pool.getConnection();
  await connection.query(
    `DELETE FROM recipes WHERE is_deleted = 1 AND deleted_at < NOW() - INTERVAL 30 DAY`
  );
  connection.release();
  console.log('Đã xóa vĩnh viễn các bài trong thùng rác quá 30 ngày');
  process.exit(0);
})();