const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const app = express();
const net = require('net');
const { protect } = require('./middleware/auth');

// Thêm vào phần đầu file, cùng với các import khác
const debugRoutes = require('./routes/debugRoutes');

// Function to check if a port is available
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // Port is in use
      } else {
        resolve(false); // Other error, consider port unavailable
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true); // Port is available
    });
    
    server.listen(port);
  });
};

// Cấu hình CORS chính xác
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5001'],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Đăng ký các routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Đăng ký các routes đặc biệt trước
app.use('/api/recipes/saved', require('./routes/savedRecipesRoutes'));

// Đảm bảo controllers có tồn tại trước khi import routes
try {
  // Sửa lại import
  const recipeController = require('./controllers/recipeController');
  const recipeRoutes = require('./routes/recipeRoutes');
  
  // Đảm bảo đăng ký routes đặc biệt trước
  // ...các route đặc biệt khác...
  
  // Sau đó mới đăng ký route chính
  app.use('/api/recipes', recipeRoutes);
  console.log('Recipe routes loaded successfully');
} catch (error) {
  console.error('Error loading recipeRoutes:', error);
}

// THÊM DÒNG NÀY để debug
app.get('/api/recipes/:id', (req, res) => {
  console.log('Recipe detail route called for ID:', req.params.id);
  const connection = require('./config/db').pool.getConnection()
    .then(conn => {
      conn.query('SELECT * FROM recipes WHERE id = ?', [req.params.id])
        .then(async ([recipes]) => {
          if (recipes.length === 0) {
            conn.release();
            return res.status(404).json({
              success: false,
              message: `Không tìm thấy công thức với ID ${req.params.id}`
            });
          }
          
          try {
            // Truy vấn lấy ingredients
            const [ingredients] = await conn.query(
              `SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY order_index`,
              [req.params.id]
            );
            
            // Truy vấn lấy steps
            const [steps] = await conn.query(
              `SELECT * FROM steps WHERE recipe_id = ? ORDER BY order_index`,
              [req.params.id]
            );
            
            conn.release();
            
            // Kết hợp dữ liệu
            const recipe = {
              ...recipes[0],
              ingredients: ingredients || [],
              steps: steps || []
            };
            
            res.json({
              success: true,
              data: recipe
            });
          } catch (error) {
            conn.release();
            res.status(500).json({
              success: false,
              message: 'Lỗi khi lấy chi tiết công thức',
              error: error.message
            });
          }
        })
        .catch(err => {
          conn.release();
          res.status(500).json({
            success: false,
            message: 'Database error',
            error: err.message
          });
        });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: 'Database connection error',
        error: err.message
      });
    });
});

try {
  const userRoutes = require('./routes/userRoutes');
  app.use('/api/users', userRoutes);
} catch (error) {
  console.error('Error loading userRoutes:', error);
}

// Sửa lỗi reportRoutes
try {
  // Sử dụng controller thật
  const reportController = require('./controllers/reportController');
  
  // Tạo routes
  const express = require('express');
  const reportRouter = express.Router();
  const { protect } = require('./middleware/auth');
  
  reportRouter.post('/user/:id', protect, reportController.reportUser);
  reportRouter.post('/comment/:id', protect, reportController.reportComment);
  reportRouter.post('/recipe/:id', protect, reportController.reportRecipe);
  
  app.use('/api/reports', reportRouter);
  console.log('Report routes set up successfully');
} catch (error) {
  console.error('Error setting up report routes:', error);
}

// Thêm một endpoint test đơn giản
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Thêm endpoint kiểm tra trạng thái server
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

const { pool } = require('./config/db');
const { setupDatabase } = require('./utils/dbSetup');

// Cấu hình để phục vụ static files
const path = require('path');

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Thêm endpoint kiểm tra tồn tại của file
app.get('/api/file-exists', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ exists: false, message: 'Missing file path parameter' });
  }
  
  // Đảm bảo đường dẫn an toàn
  const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(__dirname, safePath);
  
  // Kiểm tra file tồn tại
  const fs = require('fs');
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.json({ exists: false, message: 'File not found' });
    }
    res.json({ exists: true, path: safePath });
  });
});

// Thêm API endpoint để liệt kê tất cả các routes
app.get('/api/routes', (req, res) => {
  try {
    const routes = [];
    
    // Xử lý stack của Express để lấy danh sách routes
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        // Routes đơn giản
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        // Router middleware
        middleware.handle.stack.forEach(handler => {
          if (handler.route) {
            const path = handler.route.path;
            const baseUrl = middleware.regexp.toString()
              .replace('\\/?(?=\\/|$)', '')
              .replace(/^\/\^/, '')
              .replace(/\/i$/, '')
              .replace(/\\\//g, '/');
            
            routes.push({
              path: baseUrl + path,
              methods: Object.keys(handler.route.methods)
            });
          }
        });
      }
    });
    
    res.json({
      success: true,
      count: routes.length,
      routes
    });
  } catch (error) {
    console.error('Error retrieving routes:', error);
    res.status(500).json({ success: false, message: 'Error retrieving routes' });
  }
});

// Thiết lập database trước khi chạy server
setupDatabase()
  .then(async () => {
    // Kiểm tra kết nối DB
    const connection = await pool.getConnection();
    
    // Cấu hình charset/collation
    await connection.query("SET NAMES utf8mb4");
    await connection.query("SET CHARACTER SET utf8mb4");
    await connection.query("SET character_set_connection=utf8mb4");
    
    console.log('Database connection successful');
    connection.release();
    
    // In ra tất cả routes được đăng ký
    console.log('\nRegistered routes:');
    app._router.stack.forEach(r => {
      if (r.route && r.route.path) {
        console.log(`${Object.keys(r.route.methods).join(', ').toUpperCase()}\t${r.route.path}`);
      } else if (r.name === 'router') {
        console.log(`[Router] ${r.regexp}`);
      }
    });
    
    // Kiểm tra port và tìm port khả dụng nếu cần
    let PORT = config.app.port || 5000;
    let isAvailable = await isPortAvailable(PORT);
    
    // Nếu port đang được sử dụng, tăng port lên 1 đơn vị và kiểm tra lại
    if (!isAvailable) {
      console.warn(`Port ${PORT} is already in use, trying alternative port...`);
      const alternativePorts = [5001, 5002, 5003, 3001, 3002, 8000, 8080];
      
      for (const altPort of alternativePorts) {
        isAvailable = await isPortAvailable(altPort);
        if (isAvailable) {
          PORT = altPort;
          console.log(`Found available port: ${PORT}`);
          break;
        }
      }
      
      if (!isAvailable) {
        throw new Error('No available ports found. Please close other applications or specify a different port.');
      }
    }
    
    // Khởi động server với port đã được kiểm tra
    app.listen(PORT, () => {
      console.log(`\nServer running in ${config.app.nodeEnv} mode on port ${PORT}`);
      console.log(`API accessible at: http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('Error starting server:', err);
    process.exit(1);
  });

// Xử lý lỗi promise không được xử lý
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});

// Đăng ký các routes trước
const commentRoutes = require('./routes/commentRoutes');
app.use('/api/comments', commentRoutes);

// Đăng ký route saved recipes ĐÚNG VỊ TRÍ
app.use('/api/recipes/saved', require('./routes/savedRecipesRoutes'));


// Đăng ký route tìm kiếm
app.use('/api/search', require('./routes/searchRoutes'));

// Đăng ký route thông báo
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

// Đăng ký admin routes
app.use('/api/admin', require('./routes/adminRoutes'));

// Đăng ký debug routes - DI CHUYỂN DÒNG NÀY LÊN ĐÂY
app.use('/api/debug', debugRoutes);
app.delete('/api/recipes/:id', protect, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    
    console.log(`[DEBUG] DELETE request for recipe ${id} by user ${userId}`);
    
    const connection = await pool.getConnection();
    
    // Kiểm tra xem recipe có tồn tại và thuộc về người dùng hiện tại không
    const [recipe] = await connection.query(
      'SELECT * FROM recipes WHERE id = ? AND author_id = ?',
      [id, userId]
    );
    
    if (recipe.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công thức hoặc bạn không có quyền xóa'
      });
    }
    
    // Xóa mềm bằng cách cập nhật cờ is_deleted
    await connection.query(
      'UPDATE recipes SET is_deleted = 1, deleted_at = NOW() WHERE id = ?',
      [id]
    );
    
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Xóa công thức thành công'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa công thức',
      error: error.message
    });
  }
});
// Thêm middleware multer để xử lý FormData đúng cách
const multer = require('multer');

// Cấu hình storage cho multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Cấu hình multer với danh sách các fields chấp nhận
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
    }
  }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'step_images[0]', maxCount: 1 },
  { name: 'step_images[1]', maxCount: 1 },
  { name: 'step_images[2]', maxCount: 1 },
  { name: 'step_images[3]', maxCount: 1 },
  { name: 'step_images[4]', maxCount: 1 },
  // Thêm các step images khác nếu cần
]);

// Sửa route POST để sử dụng middleware multer
app.post('/api/recipes', protect, upload, async (req, res) => {
  try {
    console.log("POST /api/recipes - Request body:", req.body);
    console.log("Uploaded files:", req.files);
    
    const { title, cookingTime, thoughts } = req.body;
    
    // Validate dữ liệu
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên món ăn'
      });
    }
    
    const connection = await pool.getConnection();
    
    // Tạo recipe mới
    const [result] = await connection.query(
      `INSERT INTO recipes (title, cooking_time, thoughts, author_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'published', NOW(), NOW())`,
      [title, cookingTime, thoughts, req.user.id]
    );
    
    const recipeId = result.insertId;
    
    // Xử lý hình ảnh chính
    if (req.files && req.files.image && req.files.image.length > 0) {
      const mainImagePath = '/' + req.files.image[0].path.replace(/\\/g, '/');
      await connection.query(
        `UPDATE recipes SET image_url = ? WHERE id = ?`, // ĐÃ SỬA: image -> image_url
        [mainImagePath, recipeId]
      );
    }
    
    // Xử lý nguyên liệu
    if (req.body.ingredients) {
      const ingredients = JSON.parse(req.body.ingredients);
      for (const ingredient of ingredients) {
        await connection.query(
          `INSERT INTO ingredients (recipe_id, name, quantity, unit, order_index)
           VALUES (?, ?, ?, ?, ?)`,
          [recipeId, ingredient.name, ingredient.quantity, ingredient.unit, 0]
        );
      }
    }
    
    // Xử lý các bước
    if (req.body.steps) {
      const steps = JSON.parse(req.body.steps);
      for (let i = 0; i < steps.length; i++) {
        const [stepResult] = await connection.query(
          `INSERT INTO steps (recipe_id, description, order_index)
           VALUES (?, ?, ?)`,
          [recipeId, steps[i].description, i]
        );
        
        // Xử lý hình ảnh cho từng bước
        const stepId = stepResult.insertId;
        const stepImageKey = `step_images[${i}]`;
        
        if (req.files && req.files[stepImageKey] && req.files[stepImageKey].length > 0) {
          const stepImagePath = '/' + req.files[stepImageKey][0].path.replace(/\\/g, '/');
          await connection.query(
            `UPDATE steps SET image_url = ? WHERE id = ?`, // ĐÃ SỬA: image -> image_url
            [stepImagePath, stepId]
          );
        }
      }
    }
    
    connection.release();
    
    res.status(201).json({
      success: true,
      message: 'Tạo công thức thành công',
      data: {
        id: recipeId,
        title: title
      }
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo công thức',
      error: error.message
    });
  }
});
const { recipeMultiUpload } = require('./middleware/upload');
// Add draft recipe route
app.post('/api/recipes/draft', protect, upload, async (req, res) => {
  try {
    console.log("POST /api/recipes/draft - Request body:", req.body);
    console.log("Uploaded files:", req.files);
    
    const { title, cookingTime, thoughts } = req.body;
    
    const connection = await pool.getConnection();
    
    // Create new draft recipe
    const [result] = await connection.query(
      `INSERT INTO recipes (title, cooking_time, thoughts, author_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'draft', NOW(), NOW())`,
      [title || 'Untitled Recipe', cookingTime || null, thoughts || '', req.user.id]
    );
    
    const recipeId = result.insertId;
    
    // Handle main image if exists
    if (req.files && req.files.image && req.files.image.length > 0) {
      const mainImagePath = '/' + req.files.image[0].path.replace(/\\/g, '/');
      await connection.query(
        `UPDATE recipes SET image_url = ? WHERE id = ?`,
        [mainImagePath, recipeId]
      );
    }
    
    // Handle ingredients if exists
    if (req.body.ingredients) {
      try {
        const ingredients = JSON.parse(req.body.ingredients);
        for (const ingredient of ingredients) {
          await connection.query(
            `INSERT INTO ingredients (recipe_id, name, quantity, unit, order_index)
             VALUES (?, ?, ?, ?, ?)`,
            [recipeId, ingredient.name, ingredient.quantity, ingredient.unit, 0]
          );
        }
      } catch (e) {
        console.log("Error parsing ingredients:", e);
      }
    }
    
    // Handle steps if exists
    if (req.body.steps) {
      try {
        const steps = JSON.parse(req.body.steps);
        for (let i = 0; i < steps.length; i++) {
          const [stepResult] = await connection.query(
            `INSERT INTO steps (recipe_id, description, order_index)
             VALUES (?, ?, ?)`,
            [recipeId, steps[i].description, i]
          );
          
          // Handle step images
          const stepId = stepResult.insertId;
          const stepImageKey = `step_images[${i}]`;
          
          if (req.files && req.files[stepImageKey] && req.files[stepImageKey].length > 0) {
            const stepImagePath = '/' + req.files[stepImageKey][0].path.replace(/\\/g, '/');
            await connection.query(
              `UPDATE steps SET image_url = ? WHERE id = ?`,
              [stepImagePath, stepId]
            );
          }
        }
      } catch (e) {
        console.log("Error parsing steps:", e);
      }
    }
    
    connection.release();
    
    res.status(201).json({
      success: true,
      message: 'Draft created successfully',
      data: {
        id: recipeId,
        title: title || 'Untitled Recipe'
      }
    });
  } catch (error) {
    console.error('Error creating draft recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating draft',
      error: error.message
    });
  }
});
try {
  const chatbotRoutes = require('./routes/chatbotRoutes');
  app.use('/api/chatbot', chatbotRoutes);
  console.log('Chatbot routes set up successfully');
} catch (error) {
  console.error('Error setting up chatbot routes:', error);
}
// Cuối cùng mới là middleware 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Thêm đoạn sau đây trước middleware 404 handler hoặc cuối file (nhưng trước app.listen):
app.get('/api/recipes/:id', async (req, res) => {
  try {
    console.log('Direct recipe detail route called for ID:', req.params.id);
    const connection = await pool.getConnection();
    
    // Truy vấn cơ bản để lấy thông tin recipe
    const [recipes] = await connection.query(
      `SELECT r.*, u.name as author_name, u.picture as author_picture
       FROM recipes r
       JOIN users u ON r.author_id = u.id
       WHERE r.id = ? AND r.is_deleted = 0`,
      [req.params.id]
    );
    
    // Truy vấn lấy ingredients nếu có
    const [ingredients] = await connection.query(
      `SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY order_index`,
      [req.params.id]
    );
    
    // Truy vấn lấy steps nếu có
    const [steps] = await connection.query(
      `SELECT * FROM steps WHERE recipe_id = ? ORDER BY order_index`,
      [req.params.id]
    );
    
    connection.release();
    
    if (recipes.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy công thức với ID ${req.params.id}`
      });
    }
    
    // Kết hợp dữ liệu
    const recipe = {
      ...recipes[0],
      ingredients: ingredients || [],
      steps: steps || []
    };
    
    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết công thức',
      error: error.message
    });
  }
});

// Đăng ký route chatbot


// Thêm route DELETE cho recipes trực tiếp trong Server.js
// Đặt code này ngay sau đoạn app.get('/api/recipes/:id', ...)

// Thêm mã này sau route DELETE, trước middleware 404




