const { pool } = require('../config/db');

// Lấy cài đặt hệ thống
exports.getSettings = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Kiểm tra xem bảng settings đã tồn tại chưa
    const [tables] = await connection.query("SHOW TABLES LIKE 'settings'");
    
    // Nếu bảng chưa tồn tại, trả về cài đặt mặc định
    if (tables.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          siteName: 'Recipe Sharing',
          siteDescription: 'Nền tảng chia sẻ công thức nấu ăn',
          maintenanceMode: false,
          userRegistration: true,
          moderationEnabled: true,
          autoPublish: false,
          maxUploadSize: 5,
          featuredCategories: '',
          sensitiveWords: '',
          contactEmail: 'contact@recipesharing.com'
        }
      });
    }
    
    // Lấy cài đặt từ database
    const [settings] = await connection.query('SELECT * FROM settings WHERE id = 1');
    
    // Nếu không có cài đặt, trả về cài đặt mặc định
    if (settings.length === 0) {
      connection.release();
      return res.status(200).json({
        success: true,
        data: {
          siteName: 'Recipe Sharing',
          siteDescription: 'Nền tảng chia sẻ công thức nấu ăn',
          maintenanceMode: false,
          userRegistration: true,
          moderationEnabled: true,
          autoPublish: false,
          maxUploadSize: 5,
          featuredCategories: '',
          sensitiveWords: '',
          contactEmail: 'contact@recipesharing.com'
        }
      });
    }
    
    connection.release();
    
    // Chuyển đổi chuỗi boolean thành boolean thật
    const formattedSettings = {
      ...settings[0],
      maintenanceMode: settings[0].maintenanceMode === 1,
      userRegistration: settings[0].userRegistration === 1,
      moderationEnabled: settings[0].moderationEnabled === 1,
      autoPublish: settings[0].autoPublish === 1
    };
    
    res.status(200).json({
      success: true,
      data: formattedSettings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cài đặt hệ thống',
      error: error.message
    });
  }
};

// Cập nhật cài đặt
exports.updateSettings = async (req, res) => {
  let connection;
  try {
    const {
      siteName,
      siteDescription,
      maintenanceMode,
      userRegistration,
      moderationEnabled,
      autoPublish,
      maxUploadSize,
      featuredCategories,
      sensitiveWords,
      contactEmail
    } = req.body;
    
    connection = await pool.getConnection();
    
    // Kiểm tra xem bảng settings đã tồn tại chưa
    const [tables] = await connection.query("SHOW TABLES LIKE 'settings'");
    
    // Nếu bảng chưa tồn tại, tạo bảng
    if (tables.length === 0) {
      await connection.query(`
        CREATE TABLE settings (
          id INT PRIMARY KEY,
          siteName VARCHAR(100) NOT NULL,
          siteDescription TEXT NOT NULL,
          maintenanceMode TINYINT(1) NOT NULL,
          userRegistration TINYINT(1) NOT NULL,
          moderationEnabled TINYINT(1) NOT NULL,
          autoPublish TINYINT(1) NOT NULL,
          maxUploadSize INT NOT NULL,
          featuredCategories VARCHAR(255),
          sensitiveWords TEXT,
          contactEmail VARCHAR(100) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Chuyển đổi boolean thành 0/1 cho MySQL
    const booleanToInt = (value) => value ? 1 : 0;
    
    // Kiểm tra xem đã có cài đặt chưa
    const [existingSettings] = await connection.query('SELECT * FROM settings WHERE id = 1');
    
    if (existingSettings.length === 0) {
      // Thêm mới cài đặt
      await connection.query(
        `INSERT INTO settings 
         (id, siteName, siteDescription, maintenanceMode, userRegistration, 
         moderationEnabled, autoPublish, maxUploadSize, featuredCategories, 
         sensitiveWords, contactEmail) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          1,
          siteName,
          siteDescription,
          booleanToInt(maintenanceMode),
          booleanToInt(userRegistration),
          booleanToInt(moderationEnabled),
          booleanToInt(autoPublish),
          maxUploadSize,
          featuredCategories,
          sensitiveWords,
          contactEmail
        ]
      );
    } else {
      // Cập nhật cài đặt
      await connection.query(
        `UPDATE settings SET 
         siteName = ?, 
         siteDescription = ?, 
         maintenanceMode = ?, 
         userRegistration = ?, 
         moderationEnabled = ?, 
         autoPublish = ?, 
         maxUploadSize = ?, 
         featuredCategories = ?, 
         sensitiveWords = ?, 
         contactEmail = ? 
         WHERE id = 1`,
        [
          siteName,
          siteDescription,
          booleanToInt(maintenanceMode),
          booleanToInt(userRegistration),
          booleanToInt(moderationEnabled),
          booleanToInt(autoPublish),
          maxUploadSize,
          featuredCategories,
          sensitiveWords,
          contactEmail
        ]
      );
    }
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Cài đặt hệ thống đã được cập nhật thành công'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    if (connection) connection.release();
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật cài đặt hệ thống',
      error: error.message
    });
  }
};