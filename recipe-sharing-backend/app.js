const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const { recipeUpload, recipeMultiUpload, avatarUpload } = require('./middleware/upload');
const { protect } = require('./middleware/auth');

const app = express();

// Import các routes cần thiết
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const commentRoutes = require('./routes/commentRoutes'); // THÊM DÒNG NÀY

// Cấu hình middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://ui-avatars.com", "http://localhost:5000"],
      "default-src": ["'self'", "http://localhost:5000", "http://localhost:3000", "http://localhost:5001"]
    }
  }
}));

app.use(morgan('dev'));

// Cấu hình CORS chi tiết
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5001', 'http://localhost:5000'],
  optionsSuccessStatus: 200,
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false
};

app.use(cors(corsOptions));

// Thêm các tiêu đề CORS cho tệp tĩnh
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads/')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  }
  next();
});

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Đảm bảo ứng dụng phục vụ các file tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Thêm route cụ thể cho uploads để đảm bảo chúng luôn được phục vụ
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads/recipes', express.static(path.join(__dirname, 'public/uploads/recipes')));
app.use('/uploads/steps', express.static(path.join(__dirname, 'public/uploads/steps')));
app.use('/uploads/avatars', express.static(path.join(__dirname, 'public/uploads/avatars')));

// Thêm cấu hình cụ thể cho từng thư mục con
app.use('/uploads/recipes', express.static(path.join(__dirname, 'public/uploads/recipes'), {
  setHeaders: function (res) {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

app.use('/uploads/steps', express.static(path.join(__dirname, 'public/uploads/steps'), {
  setHeaders: function (res) {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

app.use('/uploads/avatars', express.static(path.join(__dirname, 'public/uploads/avatars'), {
  setHeaders: function (res) {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Đảm bảo thư mục uploads tồn tại
const recipeUploadsDir = path.join(__dirname, 'public/uploads/recipes');
const avatarUploadsDir = path.join(__dirname, 'public/uploads/avatars');

if (!fs.existsSync(recipeUploadsDir)) {
  fs.mkdirSync(recipeUploadsDir, { recursive: true });
  console.log(`Created recipe uploads directory: ${recipeUploadsDir}`);
}

if (!fs.existsSync(avatarUploadsDir)) {
  fs.mkdirSync(avatarUploadsDir, { recursive: true });
  console.log(`Created avatar uploads directory: ${avatarUploadsDir}`);
}

// Routes
// Đảm bảo các routes authRoutes được đăng ký trước
app.use('/api/auth', authRoutes);

// Các routes khác - đặt route cụ thể trước route chung
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reports', reportRoutes);
app.use('/api/debug', require('./routes/debugRoutes'));
app.use('/api/webhooks', require('./routes/webhookRoutes'));

// API lấy danh sách công thức đã lưu - bảo vệ bằng middleware protect
app.use('/api/user/saved-recipes', protect, require('./routes/userSavedRoutes'));

// API lấy danh sách công thức của người dùng
app.use('/api/recipes/user', require('./routes/userRecipeRoutes'));

// API thông báo
app.use('/api/notifications', notificationRoutes);

// API tìm kiếm
app.use('/api/search', searchRoutes);

// Route recipes đặt sau cùng vì có nhiều dynamic params
const savedRecipesRoutes = require('./routes/savedRecipesRoutes');
// Nếu chưa có file draftRecipeRoutes.js, KHÔNG cần require

// Đăng ký các route đặc biệt TRƯỚC
app.use('/api/recipes/saved', savedRecipesRoutes);
// app.use('/api/recipes/drafts', draftRecipeRoutes); // chỉ dùng nếu có file này

// Sau đó mới đến route cha
app.use('/api/recipes', recipeRoutes);

// Route kiểm tra xác thực
app.use('/api/check-auth', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  res.json({
    authenticated: !!token,
    tokenProvided: !!token,
    tokenBeginsWith: token ? token.substring(0, 10) + '...' : null,
    headers: req.headers
  });
});

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Recipe Sharing API is working' });
});

// Debug routes
app.use('/api/debug', require('./routes/debugRoutes'));

// Thêm route test để kiểm tra
app.post('/api/test-register', (req, res) => {
  console.log('Test register route called');
  console.log('Request body:', req.body);
  res.status(200).json({ 
    success: true,
    message: 'Test register route working'
  });
});

// Admin routes - đưa khai báo này lên trước khi sử dụng
const adminRoutes = require('./routes/adminRoutes');
// Đảm bảo thứ tự các routes đúng
app.use('/api/admin', adminRoutes);

// Webhooks
app.use('/api/webhooks', require('./routes/webhookRoutes'));

// Thêm vào trước các route để debug
app.use('/api/check-auth', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  res.json({
    authenticated: !!token,
    tokenProvided: !!token,
    tokenBeginsWith: token ? token.substring(0, 10) + '...' : null,
    headers: req.headers
  });
});

// Đăng ký routes
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));

// Route chung cho /api để liệt kê các endpoints
app.get('/api', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if(middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if(middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        const path = handler.route ? handler.route.path : '';
        const methods = handler.route ? Object.keys(handler.route.methods) : [];
        routes.push({ path: middleware.regexp.toString() + path, methods });
      });
    }
  });
  
  res.json({
    success: true,
    message: 'API Documentation',
    endpointCount: routes.length,
    availableEndpoints: routes
  });
});

// Cập nhật hoặc thêm dòng này để đảm bảo các routes được đăng ký đúng

// Đảm bảo đã import các routes
const recipeRoutes = require('./routes/recipeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Đăng ký các routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Thêm route để liệt kê tất cả các endpoints có sẵn
app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if(middleware.route) { // Routes trực tiếp
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if(middleware.name === 'router') { // Router middleware
      middleware.handle.stack.forEach((handler) => {
        const path = handler.route ? handler.route.path : '';
        const basePath = middleware.regexp.toString().replace('\\/?(?=\\/|$)', '').replace(/^\/\^\\\//, '/').replace(/\\\/\?\(\?\=\\\/\|\$\)\/i$/, '');
        const fullPath = basePath !== '/' ? basePath + path : path;
        
        if (handler.route) {
          routes.push({
            path: fullPath,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.status(200).json({
    success: true,
    count: routes.length,
    routes
  });
});

// Đăng ký route comments - Thêm dòng này nếu chưa có
app.use('/api/comments', commentRoutes);

// Thêm route debug
app.get('/api/debug-routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push(middleware.route.path);
    }
  });
  res.json(routes);
});

// Thêm route này để hỗ trợ URL cũ
app.use('/api/messages/admin', (req, res) => {
  // Chuyển hướng request tới endpoint đúng
  req.url = '/';
  app._router.handle(req, res);
});

// Đăng ký route thật
const messageRoutes = express.Router();
messageRoutes.post('/', protect, notificationController.sendMessageToAdmin);
app.use('/api/messages', messageRoutes);

// Đặt đoạn này trong phần đăng ký routes

// Đảm bảo recipeRoutes được import
const recipeRoutes = require('./routes/recipeRoutes');

// Đảm bảo đăng ký routes
app.use('/api/recipes', recipeRoutes);

// Chatbot routes
const chatbotRoutes = require('./routes/chatbotRoutes');
app.use('/api/chatbot', chatbotRoutes);

// Đảm bảo các route động (có tham số) được đăng ký sau cùng

// Error handler
app.use(errorHandler);

module.exports = app;