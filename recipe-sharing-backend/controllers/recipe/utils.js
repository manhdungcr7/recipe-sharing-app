const { pool } = require('../../config/db');

/**
 * Xử lý hình ảnh chính của công thức
 * @param {Object} req - Request object
 * @returns {string|null} URL hình ảnh hoặc null
 */
exports.processMainImage = (req) => {
  let imageUrl = null;
  
  // Nếu req.files là một mảng (đến từ multer.any())
  if (req.files && Array.isArray(req.files)) {
    const mainImageFiles = req.files.filter(file => file.fieldname === 'image');
    if (mainImageFiles.length > 0) {
      imageUrl = `/uploads/recipes/${mainImageFiles[0].filename}`;
    }
  } 
  // Nếu req.files là một đối tượng (đến từ multer.fields())
  else if (req.files && typeof req.files === 'object') {
    if (req.files.image && req.files.image.length > 0) {
      imageUrl = `/uploads/recipes/${req.files.image[0].filename}`;
    }
  }
  
  // Sử dụng filesByFieldName nếu có
  if (req.filesByFieldName && req.filesByFieldName['image']) {
    imageUrl = `/uploads/recipes/${req.filesByFieldName['image'].filename}`;
  }
  
  // Nếu có req.file trực tiếp (từ multer.single())
  if (req.file) {
    imageUrl = `/uploads/recipes/${req.file.filename}`;
  }
  
  return imageUrl;
};

/**
 * Xử lý hình ảnh cho các bước của công thức
 * @param {Object} req - Request object
 * @param {number} recipeId - ID của công thức
 * @param {Object} connection - Database connection
 * @returns {Promise<void>}
 */
exports.processStepImages = async (req, recipeId, connection) => {
  if (!req.files) return;
  
  // Nếu req.files là một mảng
  if (Array.isArray(req.files)) {
    const stepImageFiles = req.files.filter(file => file.fieldname.startsWith('step_images'));
    
    for (const file of stepImageFiles) {
      const match = file.fieldname.match(/\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1]);
        const imageUrl = `/uploads/steps/${file.filename}`;
        
        // Tìm step tương ứng trong database
        const [existingSteps] = await connection.query(
          'SELECT id FROM steps WHERE recipe_id = ? AND order_index = ?',
          [recipeId, index]
        );
        
        if (existingSteps.length > 0) {
          await connection.query(
            'UPDATE steps SET image_url = ? WHERE id = ?',
            [imageUrl, existingSteps[0].id]
          );
        }
      }
    }
  } 
  // Nếu req.files là một đối tượng
  else if (typeof req.files === 'object') {
    for (const key in req.files) {
      if (key.startsWith('step_images')) {
        const match = key.match(/\[(\d+)\]/);
        if (match && req.files[key].length > 0) {
          const index = parseInt(match[1]);
          const file = req.files[key][0];
          const imageUrl = `/uploads/steps/${file.filename}`;
          
          // Tìm step tương ứng trong database
          const [existingSteps] = await connection.query(
            'SELECT id FROM steps WHERE recipe_id = ? AND order_index = ?',
            [recipeId, index]
          );
          
          if (existingSteps.length > 0) {
            await connection.query(
              'UPDATE steps SET image_url = ? WHERE id = ?',
              [imageUrl, existingSteps[0].id]
            );
          }
        }
      }
    }
  }
};

/**
 * Parse dữ liệu JSON nếu là string 
 * @param {string|Array} data - Dữ liệu cần parse
 * @returns {Array} Mảng dữ liệu đã parse
 */
exports.parseJsonData = (data) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse JSON data:", e);
      return [];
    }
  }
  return data || [];
};