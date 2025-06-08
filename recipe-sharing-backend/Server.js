const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const app = express();
const net = require('net');

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
  const recipeRoutes = require('./routes/recipeRoutes');
  app.use('/api/recipes', recipeRoutes);
} catch (error) {
  console.error('Error loading recipeRoutes:', error);
}

try {
  const userRoutes = require('./routes/userRoutes');
  app.use('/api/users', userRoutes);
} catch (error) {
  console.error('Error loading userRoutes:', error);
}

// Sửa lỗi reportRoutes
try {
  // Tạo controller tạm thời nếu chưa có
  const reportController = {
    reportRecipe: (req, res) => res.json({ message: 'Report recipe received' }),
    reportComment: (req, res) => res.json({ message: 'Report comment received' }),
    reportUser: (req, res) => res.json({ message: 'Report user received' })
  };
  
  // Tạo routes
  const express = require('express');
  const reportRouter = express.Router();
  const { protect } = require('./middleware/auth');
  
  reportRouter.post('/recipe/:id', protect, reportController.reportRecipe);
  reportRouter.post('/comment/:id', protect, reportController.reportComment);
  reportRouter.post('/user/:id', protect, reportController.reportUser);
  
  app.use('/api/reports', reportRouter);
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

// Phục vụ thư mục uploads
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